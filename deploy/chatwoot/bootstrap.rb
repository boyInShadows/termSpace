# TermSpace / Chatwoot bootstrap.
#
# Run once after the first `db:chatwoot_prepare`:
#   docker compose exec -T rails bundle exec rails runner - < bootstrap.rb
#
# Idempotent: safe to re-run; existing records are reused and secrets are kept.
# Requires BOOTSTRAP_ADMIN_PASSWORD in the environment.
#
# Creates:
#   - a SuperAdmin who is also the TermSpace account administrator
#   - the TermSpace account
#   - two website (web widget) inboxes: English and Persian
#   - the Termbuddy agent bot, attached to both inboxes
#
# Prints a JSON block with the IDs/tokens needed by the bot and the web app.

require 'json'

email = ENV.fetch('BOOTSTRAP_ADMIN_EMAIL', 'admin@termspace.dev')
password = ENV.fetch('BOOTSTRAP_ADMIN_PASSWORD')
name = ENV.fetch('BOOTSTRAP_ADMIN_NAME', 'TermSpace Admin')
bot_url = ENV.fetch('BOT_OUTGOING_URL', 'http://termbuddy:8787/webhook')

user = User.find_or_initialize_by(email: email)
user.name = name
user.type = 'SuperAdmin' if user.type.blank?
user.password = password
user.password_confirmation = password
user.skip_confirmation!
user.save!

account = Account.find_or_create_by!(name: 'TermSpace')

account_user = AccountUser.find_or_initialize_by(account: account, user: user)
account_user.role = :administrator
account_user.save!

# Chatwoot splits this on commas to build `frame-ancestors`; a newline-separated
# list leaks the second host into the CSP header as an invalid directive name.
WIDGET_ALLOWED_DOMAINS = 'termspace.dev,www.termspace.dev'.freeze

# Two widget inboxes so the welcome copy can be localized per locale. The same
# agent bot answers both.
def widget_inbox(account:, name:, title:, tagline:, color:)
  inbox = Inbox.find_or_initialize_by(account: account, name: name)
  if inbox.new_record?
    inbox.channel = Channel::WebWidget.new(
      account: account,
      website_url: 'https://termspace.dev',
      widget_color: color,
      welcome_title: title,
      welcome_tagline: tagline,
      reply_time: 'in_a_few_minutes',
      continuity_via_email: false,
      allowed_domains: WIDGET_ALLOWED_DOMAINS
    )
  end
  # Reruns repair inboxes created with the old newline-separated value.
  inbox.channel.update!(allowed_domains: WIDGET_ALLOWED_DOMAINS) if !inbox.new_record? && inbox.channel.allowed_domains != WIDGET_ALLOWED_DOMAINS
  # Termbuddy is the only responder: never ask visitors for an email and never
  # send transcript/notification mail.
  inbox.enable_email_collect = false
  inbox.save! if inbox.changed?
  inbox
end

inboxes = [
  widget_inbox(
    account: account,
    name: 'TermSpace Website (EN)',
    title: 'Termbuddy',
    tagline: 'Ask me anything about TermSpace — catalog, accounts, publishing, or trust and safety.',
    color: '#2051CE'
  ),
  widget_inbox(
    account: account,
    name: 'TermSpace Website (FA)',
    title: 'ترم‌بادی',
    tagline: 'درباره کاتالوگ، حساب کاربری، انتشار یا اعتماد و امنیت بپرسید.',
    color: '#2051CE'
  )
]

bot = account.agent_bots.find_or_initialize_by(name: 'Termbuddy')
bot.description = 'Automated TermSpace support assistant (GPT-6 Luna). No human agents on this inbox.'
bot.outgoing_url = bot_url
bot.save!
bot.create_access_token if bot.access_token.blank?

inboxes.each do |inbox|
  agent_bot_inbox = AgentBotInbox.find_or_initialize_by(inbox: inbox)
  agent_bot_inbox.agent_bot = bot
  agent_bot_inbox.status = :active
  agent_bot_inbox.save!
end

puts JSON.pretty_generate(
  admin: { email: email, password: password, super_admin: user.type == 'SuperAdmin' },
  account: { id: account.id, name: account.name },
  inboxes: inboxes.map do |inbox|
    {
      id: inbox.id,
      name: inbox.name,
      website_token: inbox.channel.website_token,
      allowed_domains: inbox.channel.allowed_domains,
      welcome_title: inbox.channel.welcome_title
    }
  end,
  agent_bot: {
    id: bot.id,
    name: bot.name,
    outgoing_url: bot.outgoing_url,
    access_token: bot.access_token.token,
    secret: bot.secret
  }
)

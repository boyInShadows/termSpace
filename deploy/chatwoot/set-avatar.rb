# Sets the Termbuddy picture on the agent bot (shown beside its messages) and on both website inboxes
# (shown in the widget header). Separate from bootstrap.rb so it can be re-run without touching the admin password.
#
#   docker compose exec -T -e TERMBUDDY_AVATAR_URL=https://raw.githubusercontent.com/<owner>/<repo>/<commit>/apps/web/public/brand/termbuddy-512.png \
#     rails bundle exec rails runner - < set-avatar.rb
#
# Pass a commit-pinned raw.githubusercontent.com URL. Replaces any existing picture; fails loudly on a bad download.
require 'open-uri'

url = ENV.fetch('TERMBUDDY_AVATAR_URL')
abort "refusing #{url[0, 60]}: only https://raw.githubusercontent.com is accepted" unless url.start_with?('https://raw.githubusercontent.com/')

png = URI.parse(url).open(read_timeout: 15, open_timeout: 10, redirect: false, &:read)
abort 'downloaded file is not a PNG' unless png.byteslice(0, 8) == "\x89PNG\r\n\x1a\n".b

targets = [AgentBot.find_by!(name: 'Termbuddy')] + Inbox.where(name: ['TermSpace Website (EN)', 'TermSpace Website (FA)']).to_a
abort 'expected the bot and two inboxes' unless targets.size == 3

targets.each do |record|
  record.avatar.attach(io: StringIO.new(png), filename: 'termbuddy.png', content_type: 'image/png')
  puts "#{record.class.name} #{record.id}: avatar attached (#{png.bytesize} bytes)"
end

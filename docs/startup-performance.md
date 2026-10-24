# Web startup performance investigation

Updated 2026-10-24. These are lab results, not field INP or real-phone acceptance.

## Hosted dashboard input delay

The original [product-dialog run](https://github.com/boyInShadows/termSpace/actions/runs/39752758665)
failed the 130 ms max-potential-FID gate. It has not been rerun or discarded.
The subsequent [formatter run](https://github.com/boyInShadows/termSpace/actions/runs/39758934718)
and [five-step editor run](https://github.com/boyInShadows/termSpace/actions/runs/40013636290)
pass, but their passing medians do not establish a stable fix.

| Commit | Dashboard CPU indices | FID samples, ms | Median, ms |
| --- | --- | --- | --- |
| `f9144db` | 2418.5–2461 | 238 / 135 / 126 | 135 |
| `400c2dd` | 2476.5–2501 | 134 / 118 / 109 | 118 |
| `1554e45` | 2897.5–3083.5 | 121 / 85 / 77 | 85 |

All three use the existing hosted 3× CPU profile. Assertions and network
settings are unchanged. The latest CPU indices exceed the calibration's
previous warm range on some samples; this is context for comparison, not a
reason to change throttling or budgets.

The retained `400c2dd` dashboard traces identify shared framework startup as
the largest scripting task. `EvaluateScript` for
`1968-aad9ddfd306c16c8.js` takes 43.384 / 38.999 / 36.301 ms before simulated
throttling. Its containing tasks take 44.635 / 39.207 / 36.486 ms; at 3×,
those durations account for the reported 134 / 118 / 109 ms FID samples.
The first trace also has a 52.772 ms layout task, so this is not an exclusive
diagnosis of all startup work.
The metric excludes tasks before first contentful paint; see the
[Lighthouse definition](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-max-potential-fid).

That same framework chunk appears in the original failed reports and both
later runs. It includes Next's App Router, initial router state and Flight
stream reader. In `1554e45`, its evaluation tasks are 28.169 / 28.180 /
25.506 ms. The first dashboard sample instead has a 40.234 ms scheduled
callback task, producing its 121 ms FID. A faster hosted execution environment
is therefore material to the apparent improvement. Attribution to a particular
CPU/JIT cause would require more controlled evidence.

Two local 6× CPU profiles also retain framework module initialization and cold
number formatting as startup costs: the number helper has about 53–55 ms of
self time. Formatter reuse removes repeated construction, not the first
locale initialization. No additional formatter shortcut is justified by this
investigation, and private responses must remain uncached.

Evidence: ignored `maintenance/queue-20261023/`, containing the two original
downloaded artifact archives, nine traces per hosted run, reports, compact
comparisons and two local CPU profiles. Original failed reports remain under
`maintenance/queue-20261022/hosted-lighthouse/`. Interrupted CLI downloads
were replaced by resumable range downloads of the original archives; no CI
job was rerun to obtain a passing result.

## Remaining acceptance

The 130 ms hosted gate remains a risk until reduced startup work is measured
under comparable CPU conditions. The separate mobile LCP targets remain
home 2200 ms, dashboard 2000 ms and product detail 2200 ms under the existing
simulated Lighthouse profile. Applied-throttling diagnostics and browser
viewport checks cannot substitute for those targets or physical phones.

## LCP follow-up trials, 2026-10-24

The retained hosted dashboard's LCP element is the server-rendered summary
paragraph. In its second sample the observed LCP is approximately 104 ms on
the unthrottled collection, while the modeled result is 2151 ms. Both Lantern
estimates end at the shared React chunk's modeled download completion. This
identifies a transfer constraint in the lab model; it does not invalidate the
existing acceptance profile or demonstrate real-phone performance.

The normal production build was measured against the mock API before and
after adding locale-correct font `Link` response headers through the proxy.
The dashboard originally advertised CSS without its font in the response
headers; the home page already advertised its font. The trial added the
missing hint, but the single before/after samples did not establish a useful
gain: dashboard 2821 → 2791 ms, detail 2628 → 2630 ms, home 2865 → 2635 ms.
The home change is not attributed to the hint because that hint already
existed. All application and test changes from this trial were reverted.

An offline Brotli sizing diagnostic reduces first-load JavaScript by about
16%: home 166604 → 139992 bytes, dashboard 162964 → 136640, detail
168458 → 141402. Substituting the available core-asset transfer sizes in the
second hosted dashboard sample leaves its modeled estimate at 2151 ms.
This limited what-if calculation is not a production delivery measurement;
it does not justify adding a compression build pipeline or claim Brotli
cannot improve a deployed site.

Parallelizing the private dashboard reads ahead of identity verification was
also considered and not implemented. The existing regression contract forbids
those reads for anonymous or unverified readers. Request-scoped identity,
cookie binding, no-store behavior and that verification sequence are intact.

The strict LCP targets remain unfinished. The build was restored from the
unchanged application source. Trial patches, reports, traces and diagnostics
remain under ignored `maintenance/queue-20261023/`. Physical-device and Persian
wording acceptance remain human tasks; `owner-review.json` in that directory
adds the five-step editor's 21 wording choices to the earlier review material.

## CSS delivery trial, 2026-10-24

A fresh baseline and a disposable `experimental.inlineCss: true` build each ran
three Lighthouse samples on home, dashboard and detail. Both used the committed
`e2cefde` application, the same mock API and signed-in creator fixture, and fresh
dedicated Chrome profiles. The probe asserted that throttling, screen emulation
and form factor match the existing Lighthouse profile. No budget or timing
setting changed. Accessibility was 100 in all eighteen reports.

| Route | Baseline median LCP | Inline CSS median LCP | Additional median page bytes |
| --- | --- | --- | --- |
| `/` | 2632 ms | 2859 ms | 24,507 |
| `/dashboard` | 2792 ms | 2942 ms | 27,631 |
| `/products/conversion-copywriter` | 2632 ms | 2789 ms | 27,919 |

CPU benchmark medians differ by approximately +0.5%, -1.8% and +4.5%,
respectively. This bounds an obvious comparison risk; it does not make these
small lab samples a field-performance result. The trial did not establish a
gain. Median max-potential-FID remained 76/79/77 ms on the baseline and
81/79/78 ms with inlining, without establishing a hosted startup fix.

The second dashboard samples give the same modeled critical tail: the shared
React DOM script's transfer, an approximately 79–80 ms CPU task, then root layout
and error-script requests. Inlining shifts that large script's modeled start
from 754 to 904 ms, rather than removing it from the graph. Both optimistic and
pessimistic estimates regress by about 150 ms. The installed Lantern model
includes candidate scripts based on completion and evaluation relative to the
observed paint; a script on this modeled path is not proof that server-rendered
text semantically requires it.

A separate browser probe measured home reloads and client navigation. The normal
home document transferred 21,414 encoded body bytes plus a 13,835-byte stylesheet
transfer on a cold load; that stylesheet transferred zero bytes on the warm
reload. With inlining, the document transferred 61,332 encoded body bytes on
both loads. Its decoded body grew from 105,823 to 322,570 bytes. Client navigation
from home to Explore fetched no additional stylesheet in either build, and the
RSC transfer was approximately 5 kB in both. These byte observations do not
measure real-device interaction latency or every navigation path.

Next's [inline CSS documentation](https://nextjs.org/docs/app/api-reference/config/next-config-js/inlineCss)
describes its experimental status, duplicated initial styles and loss of
independent stylesheet caching. Those tradeoffs produced no benefit here. The
single configuration change was reverted, its patch retained, and the restored
isolated build passes with no application-source diff. No deployment, compression
pipeline, custom bootstrap loader or private-data fetching change was introduced.

Evidence: ignored `maintenance/startup-performance-20261024/` contains all
eighteen reports, second-sample traces/devtools logs for each route, configuration
assertions, raw comparisons, critical-path output, reload/navigation observations
and the rejected patch. The strict 2200/2000/2200 ms LCP targets and comparable
hosted 130 ms input-delay acceptance remain unfinished.

## Reporting integration bundle regression, 2026-10-24

The reporting UI integrated at `a4935f8` exceeded the existing Persian product
first-load JavaScript gate: 165.2 kB versus 165 kB. Its case endpoint helpers
were exported by the shared startup API module. The existing listing-moderation
helpers had the same coupling. Moving those eleven unchanged endpoint bodies
into their respective feature modules removes 336 gzip bytes from each measured
startup route. They continue using the same credentialed, uncached request client;
timeouts, cancellation, error details and mutation retry behavior are unchanged.

| Route | Before, gzip kB | After, gzip kB | Existing gate, kB |
| --- | ---: | ---: | ---: |
| `/` and `/fa` | 163.2 | 162.8 | 170 |
| `/dashboard` and `/fa/dashboard` | 168.2 | 167.9 | 170 |
| `/products/conversion-copywriter` | 153.8 | 153.5 | 165 |
| `/fa/products/conversion-copywriter` | 165.2 | 164.9 | 165 |

Measurements use unique initial non-`nomodule` script tags and gzip the matching
production assets, exactly as the browser budget test does. The private case
endpoint path no longer occurs in these initial scripts. This is a small bundle
regression fix, with little headroom on the Persian detail gate; it does not
establish an LCP or interaction timing improvement. Strict LCP, comparable hosted
input delay and physical-device acceptance remain open. Before/after sizes,
builds and verification evidence live in ignored
`maintenance/reporting-performance-20261024/`.

All nine follow-up Lighthouse reports pass the existing gates with accessibility
100. Representative home/dashboard/detail LCP is 2816/2951/2803 ms, performance
96/95/96 and max-potential-FID 107/88/97 ms. These samples do not meet the stricter
2200/2000/2200 ms LCP targets or close comparable hosted timing acceptance.

## Public startup asset delivery, 2026-10-24

The normal web build now generates Brotli variants of its public JavaScript and
CSS, verifies every decoded variant against the original bytes and writes a
manifest of generated asset paths. The existing Next proxy negotiates explicit
Brotli support; a Route Handler returns only files listed by that build.
Development, refused encodings, missing variants and range requests retain the
normal static handler. Queries and English/Persian routing are preserved.

The separate response handler is necessary in the installed Next 16.3.8:
middleware responses filter `Content-Encoding`, which made a direct rewrite to
a `.br` file return encoded bytes without their encoding header. That prototype
was rejected. The retained path uses ordinary Next
[rewrites](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) and
a response that owns the encoded body, with the original JavaScript/CSS MIME
type, `Vary: Accept-Encoding`, immutable public caching and a strong ETag for
conditional 304 responses. Direct handler rejections and missing files return
uncached 404 responses.

This applies to the self-hosted Next server used by the current Docker and CI
packaging. Retain `.next/static` and `.next/compressed-assets.json` together.
Builds without the compression manifest or an available variant fall back to
normal asset delivery. No dependencies, private-response caching, authentication
sequence, page content or timing budgets change.

A preliminary Turbopack build succeeded but exceeded the 165 kB product budget
in both locales (165.3 kB each). Its three timing samples did not establish an
LCP improvement, so the web build retains webpack. An offscreen-layout
inspection measured peak layout tasks of approximately 16/22/17 ms on
home/dashboard/detail; no rendering-containment change was retained.

Evidence, including rejected prototypes, raw encoding checks, traces, reports
and render captures, lives under ignored
`docs/artifacts/startup-delivery-20261024/`. New regression tests live under
`apps/web/tests/`; the existing test directories remain supported. The transport
project writes failure evidence under `docs/artifacts/playwright-transport/`.
Strict LCP, comparable hosted input delay, physical-device and native Persian
wording acceptance remain unfinished.

The final stock LHCI run passes all nine reports with accessibility 100. The
comparison below uses numeric medians of three reports per route before and
after, with identical throttling, screen emulation and form factor. The baseline
is the prior reporting-budget phase; all CPU indices and individual reports are
retained in the comparison artifact.

| Route | Baseline LCP, ms | Brotli LCP, ms | Baseline transfer, bytes | Brotli transfer, bytes |
| --- | ---: | ---: | ---: | ---: |
| `/` | 2816 | 2500 | 321839 | 293489 |
| `/dashboard` | 2951 | 2803 | 342993 | 312396 |
| `/products/conversion-copywriter` | 2803 | 2484 | 319407 | 289895 |

Performance scores are 97/96/97, median max-potential-FID 70/77/68 ms, and all
six gzip JavaScript budgets remain unchanged and passing. These timing samples
do not meet the stricter LCP targets or establish a comparable hosted startup
fix. Raw HTTP tests verify JavaScript/CSS decode equality, gzip refusal fallback,
HEAD, ranges, immutable cache headers and body-free 304 revalidation.

## Hosted follow-up and remaining download cost, 2026-10-24

The [application CI run](https://github.com/boyInShadows/termSpace/actions/runs/40124384845)
and [web validation run](https://github.com/boyInShadows/termSpace/actions/runs/40124384917)
both pass at `d5ac348`. Hosted Playwright passes 437 scenarios with 46 existing
skips and no reported flaky tests. All nine hosted Lighthouse reports pass the
unchanged gates. Numeric medians of three samples per route are:

| Route | LCP, ms | Max-potential-FID, ms |
| --- | ---: | ---: |
| `/` | 2409 | 90 |
| `/dashboard` | 2278 | 74 |
| `/products/conversion-copywriter` | 2164 | 83 |

Hosted CPU benchmark indices span 2922.5–3069.5. The original failing dashboard
reference was 2418.5–2461, so these passing results do not establish comparable
CPU acceptance. The stricter local targets remain open as recorded above.

Recomputing Lantern from all nine original hosted traces and network logs
reproduces each recorded LCP within 5 ms. The dashboard's modeled tail still
ends at a shared Next/React script download, with a subsequent 76 ms CPU task in
the third sample. Both framework asset hashes are unchanged from `1554e45`;
compression reduces their download bytes, not their decoded code.

An offline sensitivity check changes only modeled transfer sizes, retaining
request dependencies, CPU work and the existing profile. Its baseline reproduces
all nine original results within 0.01 ms. The following dashboard medians are
counterfactual estimates, not implemented optimizations or acceptance results:

| Transfer-size substitution | Modeled dashboard LCP, ms |
| --- | ---: |
| Original captured requests | 2278 |
| Zero bytes for every script except the two shared framework scripts | 2128 |
| Zero bytes for fonts | 2128 |
| Half the bytes for the HTML document | 2128 |
| Half the bytes for both framework scripts | 1992 |

Even the zero-byte non-core-script diagnostic misses the dashboard target.
It does not justify deleting application behavior, replacing the framework or
adding a bootstrap delay. No further runtime change is retained from this
follow-up. A subsequent delivery or startup experiment must demonstrate an
actual gain under the existing profile before its task can be removed.

Original reports and traces remain under ignored
`docs/artifacts/startup-delivery-20261024/hosted-40124384917/`. Reproduction
helpers, all eighteen current/prior critical-path summaries and the nine
sensitivity results are under `docs/artifacts/startup-followup-20261024/`.

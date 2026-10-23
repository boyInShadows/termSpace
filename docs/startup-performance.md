# Web startup performance investigation

Updated 2026-10-23. These are lab results, not field INP or real-phone acceptance.

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

<div align="center">

<img src="public/images/og.jpg" width="780" alt="GitQR playground preview" />

<br /><br />

→ <a href="https://gitqr.fun">play in the ground</a>
&nbsp;·&nbsp;
<a href="public/images/cookie.png">star for a cookie</a>
&nbsp;·&nbsp;
<a href="LICENSE">license</a>

</div>

<br />

## What

What if my contribution graph was a QR code? Same green squares, same commit rhythm scan it and it opens the profile. I couldn't stop thinking about it.

made this as a fun weekend project. It pulls a public GitHub heatmap and maps it onto a QR and also actually scans (hopefully).

<br />

## What it looks like

<p align="center"><em>what an export looks like, with labels >.<</em></p>

<p align="center">
  <img src="public/images/qr.png" width="640" alt="Annotated GitQR export: finder patterns, alignment, contribution colors, and encoded URL" />
</p>

<br />

## How it works

<p align="center"><em>paste a url. watch the board fill in.</em></p>

GitQR grabs your public contribution calendar and encodes the profile URL into a version-4 QR at error correction level H.

Version 4 is a 33×33 module grid, the smallest symbol that still fits a `github.com/username` link at level H. Level H is the highest error-correction tier: roughly 30% of modules can be restyled and decoders still recover the URL.

Every dark module in that matrix gets a color from your heatmap. Column maps to week. Row maps to weekday. Intensity maps to how hard you were coding that day.

GitHub's calendar is ~53 weeks wide; the QR is 33 columns. Linear resampling maps each module to a heatmap cell, so nearby weeks can collide on the same level:

$$
\text{week}(c)=\mathrm{round}\!\left(\frac{c}{32}(W-1)\right),\qquad
\text{day}(r)=\mathrm{round}\!\left(\frac{r}{32}\cdot 6\right)
$$

where $c,r$ are column and row indices ($0\ldots 32$) and $W$ is your week count (~53).

The position on the board is the position in your graph. Same grid logic, different job.

```mermaid
flowchart LR
    url(["github.com/you"])
    heatmap["heatmap<br/>weeks × 7"]
    matrix["QR matrix<br/>33 × 33"]
    same{{"same cell"}}
    board(["styled board"])

    url --> heatmap
    url --> matrix
    heatmap --> matrix
    heatmap --> same
    matrix --> same
    same --> board

    classDef pink fill:#FB70B3,color:#ffffff,stroke:#FB70B3
    classDef white fill:#ffffff,color:#FB70B3,stroke:#FB70B3

    class url,heatmap,matrix,board pink
    class same white
```

> The hard part is making it scannable while keeping the illusion.

GitQR tries all eight QR mask patterns and picks whichever keeps dark modules darkest on average. Pale colors on dark cells get a heavy penalty and kill phone reads.

Zero-contribution days that land on dark modules get forced to mid-gray instead of your palette's lightest swatch, so scanners can still separate them from the white background. Swapping palette doesn't re-encode.

### Scan QR

The nav **Scan QR** button decodes the live board in the browser, the same way an export would be read, but without leaving the page.

Flip scan mode and the playground dims the board, frames the QR region, and preloads the decoder WASM. Click the code and GitQR rasterizes the current styled grid to a canvas bitmap, runs decode on that `ImageData`, and opens the recovered URL in a new tab if it matches what you encoded.

Decode is two passes on that bitmap:

1. **Fast pass** - square black/white modules only, contribution colors stripped. Most styled QRs decode here.
2. **Styled fallback** — full colors, gaps, and roundness at higher resolution, with rotation, inversion, and downscale enabled if the fast pass misses.

Engines run client-side in order: `@qrstuff/qured`, then `zxing-wasm` as backup.

Any failure tells you on the board before you export or share.

<br />

## What you can do

<p align="center"><em>three things once you're on the board</em></p>

<table>
<tr>
<td width="33%" valign="top" style="padding: 16px 14px 0;">

<p><strong>scan</strong></p>

<ul>
<li>flip scan mode from the nav</li>
<li>board renders to canvas, runs decoders</li>
<li>resolves to your URL, you're good</li>
<li>doesn't, you know before you share</li>
</ul>

</td>
<td width="34%" valign="top" style="padding: 16px 14px 0;">

<p><strong>tune</strong></p>

<ul>
<li>seven palette presets</li>
<li>module roundness, square to soft pill</li>
<li>optional username cutout under the QR</li>
<li>size and color control</li>
</ul>

</td>
<td width="33%" valign="top" style="padding: 16px 14px 0;">

<p><strong>export</strong></p>

<ul>
<li>PNG or SVG</li>
<li>512, 1024, or 2048 px</li>
<li>roundness, palette, username label carry over</li>
<li>what you see on the board is what prints</li>
</ul>

</td>
</tr>
</table>

<br />

## Credits

<p align="center">
components adapted from <a href="https://www.fluidfunctionalism.com">Fluid Functionalism</a> by <a href="https://x.com/micka_design">@micka_design</a><br />
cat design inspired by <a href="https://icons8.com/">Icons8</a> illustrations
</p>

<br />

<div align="center">

<img src="public/images/logo.png" width="40" alt="" />

<em>fun fact: qr code data doesn't read like a book. the bits start near the bottom-right corner and snake upward in two-column strips, dodging the big locator squares like tiny traffic</em>

</div>

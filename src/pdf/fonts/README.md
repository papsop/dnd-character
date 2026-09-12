# Sheet fonts

Two TrueType families, embedded in every PDF the builder produces.

| Family (in code) | Typeface | Replaces |
| --- | --- | --- |
| `CF Serif`, `CF Serif Bold` | [PT Serif](https://fonts.google.com/specimen/PT+Serif) | `Times-Roman` |
| `CF Sans`, `CF Sans Bold` | [Lato](https://fonts.google.com/specimen/Lato) | `Helvetica` |

Both are licensed under the SIL Open Font License 1.1 — see `OFL-Lato.txt` and `OFL-PTSerif.txt`.

## Why these are here at all

The PDF standard fonts need no files and fetch nothing, which is why the sheet used them. But they
are WinAnsi-encoded: any character outside Latin-1 is replaced on the way into the file, so a Czech
name printed as `KYizova` and a Polish or Hungarian one fared no better. The bytes in the PDF were
wrong, not just the picture of them — no viewer or printer could have recovered the text.

## Subsetting

The files here are subsets of the Google Fonts originals, cut down from ~1.6 MB to ~670 KB total.
They cover Latin-1, Latin Extended-A and B, combining marks and typographic punctuation: every
language written in the Latin alphabet. Greek, Cyrillic and Vietnamese are **not** included — add
their ranges below and re-run if you need them.

Regenerate with [fonttools](https://github.com/fonttools/fonttools):

```bash
pip install fonttools
RANGES="U+0020-00FF,U+0100-017F,U+0180-024F,U+02B0-02FF,U+0300-036F,U+2000-206F,U+20A0-20BF,U+2100-214F,U+2150-218F,U+2190-21BB,U+2212,U+2215,U+2248,U+2260,U+2264,U+2265,U+25A0-25FF,U+2713,U+2714,U+2717"
pyftsubset Lato-Regular.ttf --unicodes="$RANGES" --layout-features='*' --output-file=Lato-Regular.ttf
```

Sources: `ofl/lato/Lato-{Regular,Bold}.ttf` and `ofl/ptserif/PT_Serif-Web-{Regular,Bold}.ttf` in
[google/fonts](https://github.com/google/fonts).

## How they load

`register.ts` hands react-pdf a URL for each face — a hashed asset served from this app's own
origin, fetched the first time a PDF is rendered. Nothing is requested from a font CDN.
`registerForNode.ts` does the same from disk for the fixture script, where there is no bundler.

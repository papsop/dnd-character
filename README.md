# Character Forge

A guided character builder for the fifth edition 2024 rules. It walks you through creation, checks
every choice against the rules as you go, and gives you a print-ready double-sided A4 character sheet
as a PDF — plus extra spell pages if you cast.

Runs entirely in your browser. No account, no server, nothing uploaded.

## Features

- Guided creation in the 2024 order: Class → Origin → Ability Scores → Details.
- Legality checked live. Illegal choices are blocked, unfinished ones are listed.
- Every number computed for you: proficiency bonus, AC, initiative, HP, hit dice, saves, skills,
  passive scores, attack bonuses, damage dice, spell save DC, spell slots.
- A printable sheet built for the table — the numbers you need on your turn are the ones you can find
  fastest.
- Characters saved in your browser, exportable as JSON, shareable by link.
- Names and notes in any language written in the Latin alphabet - Czech, Polish, Hungarian,
  Turkish - print correctly.

## The sheet

| Page | Contents |
| --- | --- |
| Front | Abilities, saves, skills, AC, HP, and the attack table — what to throw and what it does. |
| Back | Class and species features, feats, proficiencies, equipment, currency, roleplay details. |
| Extra | Full text for every cantrip and prepared spell, for casters. |

## Development

```bash
npm install
npm run dev
npm test
npm run build
```

## Licensing

Game content is from the **System Reference Document 5.2.1**, used under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/):

> This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the
> Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative
> Commons Attribution 4.0 International License, available at
> https://creativecommons.org/licenses/by/4.0/legalcode.

All artwork is original. No official artwork, logos or trade dress are used. Character portraits are
supplied by you at runtime and stay in your own browser.

The printed sheet embeds **Lato** and **PT Serif**, both under the
[SIL Open Font License 1.1](https://openfontlicense.org/) — see [src/pdf/fonts](src/pdf/fonts) for
the licences, the subset ranges, and why the PDF standard fonts could not be used.

Code and original art are MIT licensed — see [LICENSE](LICENSE). This project is not affiliated with
or endorsed by Wizards of the Coast.

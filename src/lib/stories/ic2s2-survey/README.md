## Survey story

This is an experimental layout for survey research. Through a scrolly story, we simply ask a few questions using different question types. Each question is a POST/UPSERT request using `survey.remote.ts`, which write into a small sqlite database. Since we're currently hosting the web app on vercel, we [turso](https://github.com/tursodatabase/turso) client (using the cloud free tier). Finally, we use [fingerprintjs](github.com/fingerprintjs/fingerprintjs) as identifier.

 - `survey.remote.ts`: contains the database schema for validation and logic. See also `lib/server/db/schema.ts` for the schema.
 - `copy.json`
 - `SurveyScrolly.svelte`: 
    - `SurveyQuestion.svelte`
        - `Checkbox`
        - `Radio`


The flow is as follows:

```
saveAnswers |
answers     |->  Survey Snippet -> Question Components
copy.json   | 
```

## Deep-dive: Survey Scrolly Snippet

Like in other stories, we are experimenting with a Svelte's [snippet](https://svelte.dev/docs/svelte/snippet) to work hand-in-hand with the `data/copy.json` to conduct the survey. As with other stories, the `copy.json` is the content. But here we have an additional type called `question`. With the `question` type, we are expecting that `value` is a dictionary containing the following fields: the `question`, a `name` field (corresponding to the database schema), then some `options`. This structure should be expected by all `Question` components (Radio, Checkbox, etc.). So far, we find the design pattern to be fairly generalizable.

The snippet is what we what we could abstract away from a story, or an API.

Then, the snippet takes a callback function (that we called `saveAnswer`) and a state variable (`answers`), binded together in the child component. 

We can also write questions independently, without the scrolly snippet, as we do with `<DemographicsBox />`.
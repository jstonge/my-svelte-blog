<script lang="ts">
import { generateFingerprint } from '$lib/utils/browserFingerprint.js';

import ConsentPopup from './ConsentPopup.svelte';
import DemographicsBox from './Survey.DemographicsBox.svelte';

import ScrollIndicator from '$lib/components/helpers/ScrollIndicator.svelte';
import StoryHeader from '$lib/components/StoryHeader.svelte';
import { renderTextContent } from '$lib/components/helpers/ScrollySnippets.svelte'
import { surveyScrollyContent } from '$lib/components/survey/SurveyScrolly.svelte';
import { saveAnswer as saveAnswerRemote, getSurveyResponse } from '../data/survey.remote.js';
import type { SurveyField } from '$lib/server/db/schema';

let { story, data } = $props();

// Reactive variables
let hasConsented = $state(false);
let checkingConsent = $state(true);
let userFingerprint = $state('');

let scrollyIndex = $state({ value: undefined });

// Survey answers - typed against schema to catch typos at compile time
let surveyAnswers: Partial<Record<SurveyField, string | string[]>> = $state({
    socialMediaPrivacy: '',
    platformMatters: [],
    relativePreferences: '',
    govPreferences: '',
    polPreferences: '',
    age: '',
    genderOrd: '',
    orientationOrd: '',
    raceOrd: ''
});

async function checkExistingConsent() {
    try {
        userFingerprint = await generateFingerprint();
        const survey = await getSurveyResponse(userFingerprint);
        hasConsented = !!survey?.consent;
    } catch (err) {
        console.error('Failed to check existing consent:', err);
    } finally {
        checkingConsent = false;
    }
}

// Only run in browser - fingerprinting requires window
$effect(() => {
    checkExistingConsent();
});

async function handleConsentAccept() {
    hasConsented = true;
    try {
        userFingerprint ||= await generateFingerprint();
        await saveAnswer('consent', 'accepted');
    } catch (err) {
        console.error('Failed to save consent:', err);
    }
}

let saveAnswer = $derived((field: SurveyField, value: string | number | string[]) => {
    if (!userFingerprint) return Promise.resolve();
    return saveAnswerRemote({ fingerprint: userFingerprint, field, value });
});

</script>

<!-- Consent Popup (only show after checking and if not already consented) -->
{#if !checkingConsent && !hasConsented}
    <ConsentPopup onAccept={handleConsentAccept} {userFingerprint} {saveAnswer} />
{/if}

<ScrollIndicator />

<article class="story theme-dark" id="dark-data-survey">
    <StoryHeader
        title={data.title}
        subtitle={data.subtitle}
        authors={data.authors}
        date={data.date}
    />

    <section id="intro" class="prose">
        {#each data.intro as item}
            {@render renderTextContent(item)}
        {/each}
    </section>

    <section id="survey">
        {@render surveyScrollyContent(data.survey, scrollyIndex, userFingerprint, saveAnswer, surveyAnswers)}
    </section>
    
    <section id="demographics" class="prose">
        {#each data.postSurvey as item}
            {@render renderTextContent(item)}
        {/each}

        <DemographicsBox {userFingerprint} {saveAnswer} {surveyAnswers}/>
    </section>

    <h2 class="prose">Appendix</h2>
    <section id="appendix" class="prose">
        {#each data.appendix as item}
            {@render renderTextContent(item)}
        {/each}
    </section>
    
</article>


<style>


/* Override shared ScrollySnippets styling for this story's dark theme */
:global(#dark-data-survey .scrolly-content .step > *) {
    padding: 1rem;
    background: #f5f5f5;
    color: #ccc;
    border-radius: 5px;
    box-shadow: 1px 1px 10px rgba(0, 0, 0, 0.2);
    transition: all 500ms ease;
    text-align: center;
    max-width: 600px;
    margin: 0 auto;
}

</style>

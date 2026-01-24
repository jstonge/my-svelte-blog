<script>
import { generateFingerprint } from '$lib/utils/browserFingerprint.js';

import ConsentPopup from './ConsentPopup.svelte';
import DemographicsBox from './Survey.DemographicsBox.svelte';

import { surveyScrollyContent } from '$lib/components/survey/SurveyScrolly.svelte';
import { postAnswer, upsertAnswer } from '../data/survey.remote.ts';

let { story, data } = $props();

// Reactive variables
let hasConsented = $state(false);
let userFingerprint = $state('');

let surveyScrollyState = $state({
    scrollyIndex: undefined,
    isMobile: false,
    isTablet: false
});

// Survey answers - keys match question 'name' fields in copy.json
let surveyAnswers = $state({
    socialMediaPrivacy: '',
    platformMatters: [],
    relativePreferences: '',
    govPreferences: '',
    polPreferences: '',
    age: '',
    gender_ord: '',
    orientation_ord: '',
    race_ord: ''
});



async function handleConsentAccept() {
    hasConsented = true;

    try {
        userFingerprint = await generateFingerprint();
        console.log('Fingerprint loaded:', userFingerprint);

        // Save consent after fingerprint is ready
        if (userFingerprint) {
            await saveAnswer('consent', 'accepted');
        }
    } catch (err) {
        console.error('Failed to load fingerprint:', err);
    }
}


/**
 * Story-specific saveAnswer adapter
 * Maps form field names to appropriate API calls based on field type
 * Kept here to ensure field mapping stays in sync with surveyAnswers definition above
 */
function createSaveAnswerHandler(userFingerprint) {
	return function saveAnswer(field, value) {
		if (!userFingerprint) {
			console.warn('Fingerprint not ready yet, skipping save');
			return Promise.resolve();
		}

		// Fields that need string-to-ordinal conversion
		const stringToOrdinalFields = ['consent', 'socialMediaPrivacy', 'institutionPreferences', 'demographicsMatter'];

		// Fields that already have numeric values
		const numericFields = ['relativePreferences', 'govPreferences', 'polPreferences', 'age', 'gender_ord', 'orientation_ord', 'race_ord'];

		// Handle special cases
		if (field === 'platformMatters') {
			// Convert array to comma-separated string for storage
			const stringValue = Array.isArray(value) ? value.join(',') : value;
			return upsertAnswer({ fingerprint: userFingerprint, field, value: stringValue });
		} else if (stringToOrdinalFields.includes(field)) {
			return postAnswer({ fingerprint: userFingerprint, field, value });
		} else if (numericFields.includes(field)) {
			// Convert string numbers to integers
			const numericValue = parseInt(value, 10);
			return upsertAnswer({ fingerprint: userFingerprint, field, value: numericValue });
		} else {
			console.error(`Unknown field: ${field}`);
			return Promise.reject(new Error(`Unknown field: ${field}`));
		}
	};
}

let saveAnswer = $derived(createSaveAnswerHandler(userFingerprint));

</script>

<!-- Consent Popup -->
<ConsentPopup onAccept={handleConsentAccept} {userFingerprint} {saveAnswer} />

<article class="story theme-dark" id="dark-data-survey">

    <section id="survey">
        {@render surveyScrollyContent(data.survey, surveyScrollyState, userFingerprint, saveAnswer, surveyAnswers)}

        <DemographicsBox {userFingerprint} {saveAnswer} {surveyAnswers}/>
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

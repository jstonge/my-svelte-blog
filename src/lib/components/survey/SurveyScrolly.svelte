<script module lang="ts">
    import Scrolly from '$lib/components/helpers/Scrolly.svelte';
    import { renderTextContent } from '$lib/components/helpers/ScrollySnippets.svelte';
    import Question from './SurveyQuestion.svelte';
    import type { SurveyField } from '$lib/server/db/schema';

    type SurveyItem = {
        type: 'question' | 'text';
        value: {
            question: string;
            name: SurveyField;
            options: { value: string; label: string }[];
            multiple?: boolean;
            text?: string;
        };
    };

    type ScrollyIndexObj = {
        value: number | undefined;
    };

    export { surveyScrollyContent };
</script>

<!-- Generic survey scrolly content renderer
     Handles question types and delegates text rendering to shared helper
     Stories must provide: surveyItems, scrollyState, userFingerprint, saveAnswer, answers -->
{#snippet surveyScrollyContent(
    surveyItems: SurveyItem[],
    scrollyIndexObj: ScrollyIndexObj,
    userFingerprint: string,
    saveAnswer: (field: SurveyField, value: string | number | string[]) => Promise<unknown>,
    answers: Partial<Record<SurveyField, string | string[]>>
)}
    <div class="scrolly-content survey-scrolly">
        <Scrolly bind:value={scrollyIndexObj.value}>
            {#each surveyItems as item, i}
                {@const active = scrollyIndexObj.value === i}
                <div class="step" class:active>
                    <div class="step-content">
                        {#if item.type === 'question'}
                            {@const fieldName = item.value.name}
                            <Question
                                question={item.value.question}
                                name={fieldName}
                                bind:value={answers[fieldName] as string | string[]}
                                options={item.value.options}
                                multiple={item.value.multiple || false}
                                {userFingerprint}
                                {saveAnswer}
                            />
                        {:else}
                            {@render renderTextContent(item as any)}
                        {/if}
                    </div>
                </div>
            {/each}
        </Scrolly>
        <div class="spacer"></div>
    </div>
{/snippet}
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

    type ScrollyState = {
        scrollyIndex: number | undefined;
        isMobile: boolean;
        isTablet: boolean;
    };

    export { surveyScrollyContent };
</script>

<!-- Generic survey scrolly content renderer
     Handles question types and delegates text rendering to shared helper
     Stories must provide: surveyItems, scrollyState, userFingerprint, saveAnswer, answers -->
{#snippet surveyScrollyContent(
    surveyItems: SurveyItem[],
    scrollyState: ScrollyState,
    userFingerprint: string,
    saveAnswer: (field: SurveyField, value: string | number | string[]) => Promise<unknown>,
    answers: Partial<Record<SurveyField, string | string[]>>
)}
    <div class="scrolly-content survey-scrolly">
        <Scrolly bind:value={scrollyState.scrollyIndex}>
            {#each surveyItems as item, i}
                {@const active = scrollyState.scrollyIndex === i}
                <div class="step" class:active class:mobile={scrollyState.isMobile} class:tablet={scrollyState.isTablet}>
                    <div class="step-content">
                        {#if item.type === 'question'}
                            <Question
                                question={item.value.question}
                                name={item.value.name}
                                bind:value={answers[item.value.name]}
                                options={item.value.options}
                                multiple={item.value.multiple || false}
                                {userFingerprint}
                                {saveAnswer}
                            />
                        {:else}
                            <!-- @ts-ignore - text items have different shape -->
                            {@render renderTextContent(item)}
                        {/if}
                    </div>
                </div>
            {/each}
        </Scrolly>
        <div class="spacer"></div>
    </div>
{/snippet}
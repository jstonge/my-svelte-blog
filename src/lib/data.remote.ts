import * as v from 'valibot';
import { prerender } from '$app/server';
import storiesData from '$data/stories.csv';
import { error, redirect } from '@sveltejs/kit';

// STORIES 

export interface Story {
  slug: string;
  title: string;
  description: string;
  author: string;
  date: string;
  externalUrl: string;
  tags: string;
}


const stories = storiesData as Story[];

// Query for getting all stories
export const getStories = prerender(async () => {
  return stories;
});

// Query for getting a single story by slug
export const getStory = prerender(v.string(), async (slug) => {
  const story = stories.find(d => d.slug === slug);

  if (!story) {
    error(404, 'Story not found');
  }

  // If it has an external URL, redirect to it
  if (story.externalUrl) {
    redirect(302, story.externalUrl);
  }

  // Load copy data for internal stories
  let copyData = {};
  try {
    const module = await import(`$lib/stories/${slug}/data/copy.json`);
    copyData = module.default || module;
  } catch (e) {
    console.warn(`No copy.json found for ${slug}`);
  }

  return {
    story,
    copyData
  };
});

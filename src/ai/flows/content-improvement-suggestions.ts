'use server';

/**
 * @fileOverview AI-powered content improvement suggestions for social media posts.
 *
 * This file defines a Genkit flow that takes a draft content as input and provides suggestions
 * for improvement, such as alternative phrasing, hashtags, or relevant emojis.
 *
 * @interface ContentImprovementInput - Defines the input schema for the content improvement flow.
 * @interface ContentImprovementOutput - Defines the output schema for the content improvement flow.
 * @function getContentImprovementSuggestions - The main function to trigger the content improvement flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ContentImprovementInputSchema = z.object({
  platform: z.enum(['Facebook', 'Instagram', 'WordPress']).describe('The platform for which the content is intended.'),
  content: z.string().describe('The draft content to be improved.'),
});
export type ContentImprovementInput = z.infer<typeof ContentImprovementInputSchema>;

const ContentImprovementOutputSchema = z.object({
  suggestions: z.array(
    z.string().describe('A suggestion for improving the content.')
  ).describe('A list of suggestions for improving the content.'),
});
export type ContentImprovementOutput = z.infer<typeof ContentImprovementOutputSchema>;

export async function getContentImprovementSuggestions(input: ContentImprovementInput): Promise<ContentImprovementOutput> {
  return contentImprovementFlow(input);
}

const prompt = ai.definePrompt({
  name: 'contentImprovementPrompt',
  input: {schema: ContentImprovementInputSchema},
  output: {schema: ContentImprovementOutputSchema},
  prompt: `You are an AI assistant specialized in providing content improvement suggestions for social media posts.

  Given the following content and platform, provide a list of suggestions to improve the content for better engagement.
  The suggestions should be tailored to the specified platform. Example, use hashtags for instagram. Refrain from hashtags on facebook.

  Platform: {{{platform}}}
  Content: {{{content}}}

  Provide a numbered list of suggestions. The suggestions should include alternative phrasing, relevant hashtags, or emojis.
  Do not add an intro, just the numbered list.
  `,
});

const contentImprovementFlow = ai.defineFlow(
  {
    name: 'contentImprovementFlow',
    inputSchema: ContentImprovementInputSchema,
    outputSchema: ContentImprovementOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

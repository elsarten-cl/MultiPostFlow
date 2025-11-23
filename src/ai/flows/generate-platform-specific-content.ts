'use server';

/**
 * @fileOverview Adapts a general draft to platform-specific content styles for Facebook, Instagram, and WordPress.
 *
 * - generatePlatformSpecificContent - A function that takes a general draft and adapts it for different platforms.
 * - GeneratePlatformSpecificContentInput - The input type for the generatePlatformSpecificContent function.
 * - GeneratePlatformSpecificContentOutput - The return type for the generatePlatformSpecificContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePlatformSpecificContentInputSchema = z.object({
  draft: z.string().describe('The general draft content to be adapted.'),
  platform: z.enum(['facebook', 'instagram', 'wordpress']).describe('The target platform for the content.'),
});
export type GeneratePlatformSpecificContentInput = z.infer<typeof GeneratePlatformSpecificContentInputSchema>;

const GeneratePlatformSpecificContentOutputSchema = z.object({
  platformSpecificContent: z.string().describe('The content adapted for the specified platform.'),
});
export type GeneratePlatformSpecificContentOutput = z.infer<typeof GeneratePlatformSpecificContentOutputSchema>;

export async function generatePlatformSpecificContent(input: GeneratePlatformSpecificContentInput): Promise<GeneratePlatformSpecificContentOutput> {
  return generatePlatformSpecificContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePlatformSpecificContentPrompt',
  input: {schema: GeneratePlatformSpecificContentInputSchema},
  output: {schema: GeneratePlatformSpecificContentOutputSchema},
  prompt: `You are an expert social media manager.  You will adapt the provided draft content to be appropriate for the specified platform.

Draft content: {{{draft}}}
Platform: {{{platform}}}

Adapt the content as follows:

*   Facebook: Narrative, emotional, storytelling style.
*   Instagram: Short, visual, direct style.
*   WordPress: Long, editorialized, structured style.

Return only the adapted content. Do not include any introductory or concluding remarks.
`,
});

const generatePlatformSpecificContentFlow = ai.defineFlow(
  {
    name: 'generatePlatformSpecificContentFlow',
    inputSchema: GeneratePlatformSpecificContentInputSchema,
    outputSchema: GeneratePlatformSpecificContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

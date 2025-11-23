'use server';

/**
 * @fileOverview Generates an image based on a text description.
 *
 * - generateImageFromDescription - A function that generates an image from a text description.
 * - ImageGenerationFromDescriptionInput - The input type for the generateImageFromDescription function.
 * - ImageGenerationFromDescriptionOutput - The return type for the generateImageFromDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImageGenerationFromDescriptionInputSchema = z.object({
  description: z.string().describe('A description of the image to generate.'),
});
export type ImageGenerationFromDescriptionInput = z.infer<
  typeof ImageGenerationFromDescriptionInputSchema
>;

const ImageGenerationFromDescriptionOutputSchema = z.object({
  imageUrl: z.string().describe('The URL of the generated image.'),
});
export type ImageGenerationFromDescriptionOutput = z.infer<
  typeof ImageGenerationFromDescriptionOutputSchema
>;

export async function generateImageFromDescription(
  input: ImageGenerationFromDescriptionInput
): Promise<ImageGenerationFromDescriptionOutput> {
  return imageGenerationFromDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'imageGenerationFromDescriptionPrompt',
  input: {schema: ImageGenerationFromDescriptionInputSchema},
  output: {schema: ImageGenerationFromDescriptionOutputSchema},
  prompt: 'Generate an image based on the following description: {{{description}}}',
});

const imageGenerationFromDescriptionFlow = ai.defineFlow(
  {
    name: 'imageGenerationFromDescriptionFlow',
    inputSchema: ImageGenerationFromDescriptionInputSchema,
    outputSchema: ImageGenerationFromDescriptionOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: input.description,
    });
    if (!media) {
      throw new Error('No image was generated.');
    }
    return {imageUrl: media.url!};
  }
);

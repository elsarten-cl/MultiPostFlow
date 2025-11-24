'use server';
/**
 * @fileOverview AI-powered image enhancement flow.
 *
 * This file defines a Genkit flow that takes an image and enhances it using an AI model,
 * returning the enhanced image.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const EnhanceImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type EnhanceImageInput = z.infer<typeof EnhanceImageInputSchema>;

const EnhanceImageOutputSchema = z.object({
  enhancedPhotoDataUri: z.string().describe('The data URI of the enhanced photo.'),
});
export type EnhanceImageOutput = z.infer<typeof EnhanceImageOutputSchema>;

export async function enhanceImage(input: EnhanceImageInput): Promise<EnhanceImageOutput> {
  return enhanceImageFlow(input);
}

const enhanceImageFlow = ai.defineFlow(
  {
    name: 'enhanceImageFlow',
    inputSchema: EnhanceImageInputSchema,
    outputSchema: EnhanceImageOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: [
        { media: { url: input.photoDataUri } },
        { text: 'Enhance this image. Improve lighting and color balance to make it look more professional and visually appealing. Do not add or remove any objects from the image.' },
      ],
      config: {
        responseModalities: ['IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('Image enhancement failed to return an image.');
    }

    return { enhancedPhotoDataUri: media.url };
  }
);

    
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
  prompt: `You are an expert social media manager. You will adapt the provided draft content to be appropriate for the specified platform.

Draft content: {{{draft}}}
Platform: {{{platform}}}

Adapt the content as follows:

*   Facebook: Narrative, emotional, storytelling style.
*   Instagram: Short, visual, direct style with relevant hashtags.
*   WordPress (Revista nortedato.cl): 
    **ROL:** Eres el Agente Editorial Automático de la revista NorteDato.cl. Tu misión es crear contenidos editoriales basados en el borrador proporcionado, retratando la identidad del norte de Chile (Iquique, Arica, Antofagasta, Calama) y sur del Perú (Tacna). Escribes en español de Chile con un enfoque territorial nortino.
    
    **CONTEXTO:** NorteDato.cl es una revista digital que visibiliza el norte desde el norte, conectando historias locales con oportunidades para marcas. La audiencia son personas de 25 a 60 años, profesionales, emprendedores y turistas conectados emocionalmente con el territorio. El contenido debe reforzar el orgullo nortino.

    **FOCO NARRATIVO:** El centro de tu narrativa es el emprendedor o producto del borrador. Destaca la historia real, su conexión con la vida cotidiana del norte y por qué es importante para la región. Utiliza la información de los campos del formulario para construir tu narrativa.

    **TONO Y VOZ:** Tu estilo es un híbrido entre periodístico (claro, contextualizado), narrativo/emocional nortino (historias humanas, orgullo regional) y marketing de contenidos (beneficios claros, llamado a la acción). Sé cercano, humano, analítico pero amigable e inspirador. Menciona ciudades y geografía cuando aplique. Evita jergas técnicas o frases marketineras vacías.

    **PRINCIPIOS OBLIGATORIOS:**
    1. No inventar datos. Basa tu escrito estrictamente en la información proporcionada en el borrador.
    2. Contextualizar todo desde el norte de Chile.
    3. Mantener un tono editorial honesto, destacando fortalezas reales sin exageraciones.

    **ESTRUCTURA DEL ARTÍCULO (Basado en el "Draft content"):**
    1. **Título (H1):** Crea un título de máximo 60 caracteres que sea atractivo e incluya una palabra poderosa (ej: vibrante, auténtico, imperdible, inspirador).
    2. **Introducción (80–120 palabras):** Explica quién es el emprendedor, de qué trata el producto, dónde ocurre y por qué es relevante para el norte.
    3. **Cuerpo del artículo (Extiéndete a partir del borrador):** Organiza el contenido en párrafos de máximo 5 líneas. Usa la información de "Historia y conexión con el territorio" para desarrollar la narrativa. Usa la sección de "Beneficios" para detallar el producto/servicio.
    4. **Conclusión con Llamado a la Acción:** Cierra con una reflexión nortina y utiliza la información del campo "Llamado a la acción y datos de contacto" para guiar al lector.
    
    **IMPORTANTE:** Tu única salida debe ser el artículo generado, comenzando con el Título en la primera línea y siguiendo con el cuerpo del texto. No incluyas "Título:", "H1:", "Introducción:", etc. Solo el texto final.
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


'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState, useRef } from 'react';
import Image from 'next/image';
import {
  Bot,
  CalendarIcon,
  Loader2,
  Sparkles,
  UploadCloud,
  Image as ImageIcon,
  Video,
} from 'lucide-react';
import {
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, uploadBytes } from 'firebase/storage';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Platform, PostStatus } from '@/lib/types';
import {
  generatePlatformSpecificContent,
} from '@/ai/flows/generate-platform-specific-content';
import {
  getContentImprovementSuggestions,
} from '@/ai/flows/content-improvement-suggestions';
import { enhanceImage } from '@/ai/flows/image-enhancement';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useUser, useFirestore, useStorage } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

const CITIES = ['Arica', 'Iquique', 'Antofagasta', 'Calama', 'Tacna'];

const postFormSchema = z.object({
  title: z.string().min(2, {
    message: 'El título debe tener al menos 2 caracteres.',
  }),
  city: z.string({
    required_error: 'Debes seleccionar una ciudad.',
  }),
  platforms: z.array(z.string()).refine((value) => value.length > 0, {
    message: 'Debes seleccionar al menos una plataforma.',
  }),
  schedule: z.date().optional(),
  nombreEmprendimiento: z.string().min(3, { message: "El nombre es requerido." }),
  queOfreces: z.string().min(10, { message: "Cuéntanos qué haces y por qué es especial." }),
  queProblemaResuelves: z.string().min(10, { message: "Explica qué problema resuelves." }),
  historia: z.string().min(10, { message: "La historia es importante." }),
  conexionTerritorio: z.string().min(10, { message: "La conexión con tu comunidad es clave." }),
  queQuieresQueHagaLaGente: z.string().min(5, { message: "El llamado a la acción es requerido." }),
  datosContacto: z.string().min(5, { message: "Los datos de contacto son requeridos." }),
  mediaType: z.enum(['image', 'video']).default('image'),
});

type PostFormValues = z.infer<typeof postFormSchema>;

type GeneratedContent = Partial<Record<Platform, string>>;
type Suggestions = Partial<Record<Platform, string[]>>;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function PostForm() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState<Platform | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent>({});
  const [suggestions, setSuggestions] = useState<Suggestions>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const router = useRouter();


  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: '',
      platforms: ['facebook', 'instagram'],
      nombreEmprendimiento: '',
      queOfreces: '',
      queProblemaResuelves: '',
      historia: '',
      conexionTerritorio: '',
      queQuieresQueHagaLaGente: '',
      datosContacto: '',
      mediaType: 'image',
    },
  });
  
  const selectedCity = form.watch('city');
  const selectedPlatforms = form.watch('platforms') as Platform[];
  const mediaType = form.watch('mediaType');

  async function handleGenerateContent() {
    const formValues = form.getValues();
    const draft = `
      Nombre del emprendimiento o producto: ${formValues.nombreEmprendimiento}
      ¿Qué ofreces y por qué es especial?: ${formValues.queOfreces}
      ¿Qué problema ayudas a resolver o qué necesidad satisfaces?: ${formValues.queProblemaResuelves}
      Historia del emprendimiento: ${formValues.historia}
      Conexión con tu territorio o comunidad: ${formValues.conexionTerritorio}
      ¿Qué te gustaría que haga la gente después de conocer tu emprendimiento?: ${formValues.queQuieresQueHagaLaGente}
      Datos de contacto o redes sociales: ${formValues.datosContacto}
    `;

    if (selectedPlatforms.length === 0) {
      toast({
        title: 'Falta Información',
        description: 'Por favor selecciona al menos una plataforma.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedContent({});

    try {
      const platformsToGenerate = selectedPlatforms.filter(p => !['marketplace'].includes(p)) as ('facebook' | 'instagram' | 'wordpress')[];
      const promises = platformsToGenerate.map((platform) =>
        generatePlatformSpecificContent({ draft, platform })
      );
      const results = await Promise.all(promises);

      const newContent: GeneratedContent = {};
      results.forEach((result, index) => {
        const platform = platformsToGenerate[index];
        newContent[platform] = result.platformSpecificContent;
      });
      
      if(selectedPlatforms.includes('marketplace')) {
          newContent['marketplace'] = `${formValues.queOfreces}\n\n${formValues.queProblemaResuelves}`;
      }
      
      setGeneratedContent(newContent);
    } catch (error) {
      console.error('Error generando contenido:', error);
      toast({
        title: 'Falló la Generación con IA',
        description:
          'Hubo un error generando el contenido. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleGetSuggestions(platform: Platform) {
    const content = generatedContent[platform];
    if (!content) return;

    setIsSuggesting(platform);
    try {
      const result = await getContentImprovementSuggestions({
        platform:
          (platform.charAt(0).toUpperCase() +
            platform.slice(1)) as 'Facebook' | 'Instagram' | 'WordPress',
        content,
      });
      setSuggestions((prev) => ({ ...prev, [platform]: result.suggestions }));
    } catch (error) {
      console.error('Error obteniendo sugerencias:', error);
      toast({
        title: 'Fallo al Obtener Sugerencias',
        description:
          'Hubo un error obteniendo sugerencias. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSuggesting(null);
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const dataUrl = await fileToDataUrl(file);
      setMediaPreview(dataUrl);
    }
  };

  const handleEnhanceImage = async () => {
    if (!mediaPreview || mediaType !== 'image') return;
    setIsEnhancing(true);
    try {
      const result = await enhanceImage({ photoDataUri: mediaPreview });
      setMediaPreview(result.enhancedPhotoDataUri);
      toast({
        title: 'Imagen Mejorada',
        description: 'La IA ha mejorado tu imagen. La nueva versión se muestra ahora.',
      });
    } catch (error) {
      console.error('Error mejorando la imagen:', error);
      toast({
        title: 'Error al Mejorar Imagen',
        description: 'No se pudo procesar la mejora de la imagen. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  
  const onSubmit = async (data: PostFormValues) => {
    const scheduleDate = form.getValues('schedule');
    const status: PostStatus = scheduleDate ? 'scheduled' : 'sent-to-make';
    
    if (!user) {
      toast({ title: 'No estás autenticado.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      let mediaUrl = '';
      if (mediaPreview) {
        setIsUploading(true);
        const fileName = selectedFile?.name || `${mediaType}.jpg`;
        const storageRef = ref(storage, `users/${user.uid}/${Date.now()}-${fileName}`);
        
        // If it's a data URL (potentially enhanced image), upload it as a string
        if (mediaPreview.startsWith('data:')) {
            const uploadTask = await uploadString(storageRef, mediaPreview, 'data_url');
            mediaUrl = await getDownloadURL(uploadTask.ref);
        } else if (selectedFile) { // otherwise, upload the original file
            const uploadTask = await uploadBytes(storageRef, selectedFile);
            mediaUrl = await getDownloadURL(uploadTask.ref);
        }
        setIsUploading(false);
      }
      
      const postData = {
        userId: user.uid,
        title: data.title,
        content: {
          nombreEmprendimiento: data.nombreEmprendimiento,
          queOfreces: data.queOfreces,
          queProblemaResuelves: data.queProblemaResuelves,
          historia: data.historia,
          conexionTerritorio: data.conexionTerritorio,
          queQuieresQueHagaLaGente: data.queQuieresQueHagaLaGente,
          datosContacto: data.datosContacto,
        },
        city: data.city,
        platforms: data.platforms,
        mediaUrls: mediaUrl ? [mediaUrl] : [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: status,
        scheduledAt: status === 'scheduled' ? scheduleDate : null,
        platformContent: generatedContent,
      };

      await addDoc(collection(firestore, 'users', user.uid, 'drafts'), postData);

      toast({
        title: 'Publicación Enviada',
        description: 'Tu publicación ha sido enviada para ser procesada.',
      });
      
      form.reset();
      setGeneratedContent({});
      setSuggestions({});
      setSelectedFile(null);
      setMediaPreview(null);
      router.push('/');
      
    } catch (error) {
      console.error('Error guardando:', error);
      toast({
        title: 'Error al Guardar',
        description: 'Hubo un problema al guardar tu publicación.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };
  
  const activeTab =
    selectedPlatforms.length > 0 ? selectedPlatforms[0] : undefined;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título de la Publicación</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="p. ej. Zapatillas Deportivas XYZ"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Un título interno para tu publicación.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una ciudad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CITIES.map(city => (
                               <SelectItem key={city} value={city}>{city}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      <FormDescription>
                        Esto determinará en qué revista se publicará.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Formulario NorteDato</CardTitle>
                <CardDescription>Responde estas preguntas para que la IA cree tu contenido.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="nombreEmprendimiento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del emprendimiento o producto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Café El Tostador del Desierto, Dulcería Doña Rosa…" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="queOfreces"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>¿Qué ofreces y por qué es especial?</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Cuéntanos en palabras simples qué haces y qué hace único a tu producto."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                       <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="queProblemaResuelves"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>¿Qué problema ayudas a resolver o qué necesidad satisfaces?</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ej: comida casera rápida, regalos personalizados, soluciones para empresas…"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                       <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="historia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Historia del emprendimiento</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="¿Cómo comenzó todo? ¿Qué te inspiró a crear este negocio?"
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                       <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="conexionTerritorio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conexión con tu territorio o comunidad</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="¿Cómo se relaciona tu emprendimiento con tu ciudad, barrio, familia o cultura?"
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                       <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="queQuieresQueHagaLaGente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>¿Qué te gustaría que haga la gente después de conocer tu emprendimiento?</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ej: comprar, reservar, seguir tus redes, visitar tu local…"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                       <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="datosContacto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Datos de contacto o redes sociales</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Instagram, WhatsApp, dirección, sitio web, etc."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                       <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Plataformas</CardTitle>
                </CardHeader>
                <CardContent>
                <FormField
                  control={form.control}
                  name="platforms"
                  render={({ field }) => (
                    <FormItem>
                      <TooltipProvider>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                           <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                             <FormControl>
                               <Checkbox 
                                 checked={field.value?.includes('facebook')}
                                 onCheckedChange={(checked) => {
                                   const newPlatforms = checked
                                     ? [...field.value, 'facebook']
                                     : field.value?.filter(v => v !== 'facebook');
                                   field.onChange(newPlatforms);
                                 }}
                               />
                             </FormControl>
                             <FormLabel className="font-normal">
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                    <Image src="https://nortedato.cl/wp-content/uploads/2025/10/Facebook.png" alt="Facebook Logo" width={28} height={28} />
                                 </TooltipTrigger>
                                 <TooltipContent>Facebook</TooltipContent>
                               </Tooltip>
                             </FormLabel>
                           </FormItem>
                           <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                               <Checkbox 
                                 checked={field.value?.includes('instagram')}
                                 onCheckedChange={(checked) => {
                                   const newPlatforms = checked
                                     ? [...field.value, 'instagram']
                                     : field.value?.filter(v => v !== 'instagram');
                                   field.onChange(newPlatforms);
                                 }}
                               />
                             </FormControl>
                             <FormLabel className="font-normal">
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                   <Image src="https://nortedato.cl/wp-content/uploads/2025/10/Instagram.png" alt="Instagram Logo" width={28} height={28} />
                                 </TooltipTrigger>
                                 <TooltipContent>Instagram</TooltipContent>
                               </Tooltip>
                             </FormLabel>
                           </FormItem>
                           <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                               <Checkbox 
                                 checked={field.value?.includes('wordpress')}
                                 onCheckedChange={(checked) => {
                                   const newPlatforms = checked
                                     ? [...field.value, 'wordpress']
                                     : field.value?.filter(v => v !== 'wordpress');
                                   field.onChange(newPlatforms);
                                 }}
                               />
                             </FormControl>
                             <FormLabel className="font-normal flex flex-col items-center gap-1 cursor-pointer">
                               <span>Revista</span>
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                   <Image src="https://nortedato.cl/wp-content/uploads/2025/10/Logo-Nortedatocl-General-trans.png" alt="Revista Logo" width={40} height={40} className="object-contain" />
                                 </TooltipTrigger>
                                 <TooltipContent>Revista {selectedCity || ''}</TooltipContent>
                               </Tooltip>
                             </FormLabel>
                           </FormItem>
                           <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                             <FormControl>
                               <Checkbox
                                 checked={field.value?.includes('marketplace')}
                                 onCheckedChange={(checked) => {
                                   const newPlatforms = checked
                                     ? [...field.value, 'marketplace']
                                     : field.value?.filter(v => v !== 'marketplace');
                                   field.onChange(newPlatforms);
                                 }}
                               />
                             </FormControl>
                             <FormLabel className="font-normal flex flex-col items-center gap-1 cursor-pointer">
                               <span>Marketplace</span>
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                     <Image src="https://marketplace.nortedato.cl/wp-content/uploads/2025/11/cropped-logo-Marketplace-.png" alt="Marketplace Logo" width={40} height={40} className="object-contain" />
                                 </TooltipTrigger>
                                 <TooltipContent>Marketplace Nortedato.cl</TooltipContent>
                               </Tooltip>
                             </FormLabel>
                           </FormItem>
                        </div>
                      </TooltipProvider>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  className="w-full mt-6"
                  onClick={handleGenerateContent}
                  disabled={isGenerating || selectedPlatforms.length === 0}
                >
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Bot className="mr-2 h-4 w-4" />
                  )}
                  Generar para Plataformas
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Multimedia</CardTitle>
                <CardDescription>Sube una imagen o video para tu publicación.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="mediaType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Tipo de Contenido</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => {
                            field.onChange(value);
                            setMediaPreview(null);
                            setSelectedFile(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                          defaultValue={field.value}
                          className="flex gap-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="image" id="r1" />
                            </FormControl>
                            <FormLabel htmlFor="r1" className="font-normal flex items-center gap-2"><ImageIcon/> Imagen</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="video" id="r2" />
                            </FormControl>
                            <FormLabel htmlFor="r2" className="font-normal flex items-center gap-2"><Video /> Video</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!mediaPreview ? (
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="dropzone-file"
                      className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground text-center">
                          <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {mediaType === 'image' ? 'Imagen (PNG, JPG, etc.)' : 'Video (MP4, MOV, etc.)'}
                        </p>
                      </div>
                      <Input
                        id="dropzone-file"
                        ref={fileInputRef}
                        type="file"
                        accept={mediaType === 'image' ? 'image/*' : 'video/*'}
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isUploading || isSaving}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                      {mediaType === 'image' ? (
                        <Image src={mediaPreview} alt="Vista previa" layout="fill" objectFit="contain" />
                      ) : (
                        <video src={mediaPreview} controls className="w-full h-full" />
                      )}
                      {(isUploading || isEnhancing) && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button type="button" variant="outline" size="sm" onClick={() => {
                        setMediaPreview(null);
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}>Cambiar archivo</Button>
                      
                      {mediaType === 'image' && (
                        <Button type="button" size="sm" onClick={handleEnhanceImage} disabled={isEnhancing}>
                          {isEnhancing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="mr-2 h-4 w-4" />
                          )}
                          Mejorar Imagen con IA
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="min-h-full">
              <CardHeader>
                <CardTitle>Vistas Previas de Plataforma</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPlatforms.length === 0 ? (
                  <div className="text-center text-muted-foreground py-20">
                    <Bot className="mx-auto h-12 w-12" />
                    <p className="mt-4">
                      Selecciona una plataforma y genera contenido para ver las
                      vistas previas aquí.
                    </p>
                  </div>
                ) : (
                  <Tabs defaultValue={activeTab} className="w-full">
                    <TabsList className={cn("grid w-full", `grid-cols-${selectedPlatforms.length}`)}>
                      {selectedPlatforms.map((platform) => (
                        <TabsTrigger
                          key={platform}
                          value={platform}
                        >
                          {platform === 'wordpress' ? `Revista ${selectedCity || ''}` : platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {selectedPlatforms.map((platform) => (
                      <TabsContent
                        key={platform}
                        value={platform}
                        className="mt-4 space-y-4"
                      >
                        <Textarea
                          className="min-h-[250px] font-code text-sm"
                          value={
                            isGenerating
                              ? 'Generando...'
                              : generatedContent[platform] || ''
                          }
                          readOnly={isGenerating}
                          onChange={(e) =>
                            setGeneratedContent((p) => ({
                              ...p,
                              [platform]: e.target.value,
                            }))
                          }
                        />

                        { platform !== 'marketplace' &&
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleGetSuggestions(platform)}
                            disabled={isSuggesting === platform || !generatedContent[platform]}
                          >
                            {isSuggesting === platform ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="mr-2 h-4 w-4" />
                            )}
                            Obtener Sugerencias
                          </Button>
                        }

                        {suggestions[platform] && (
                          <Alert>
                            <Sparkles className="h-4 w-4" />
                            <AlertTitle>Sugerencias de Mejora</AlertTitle>
                            <AlertDescription>
                              <ul className="list-disc pl-5 space-y-1 mt-2">
                                {suggestions[platform]?.map((s, i) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            </AlertDescription>
                          </Alert>
                        )}
                      </TabsContent>
                    ))}
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="critical" disabled={isSaving || isUploading || isEnhancing}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                Publicar / Programar
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-4 space-y-2">
                <p className="font-semibold">Programar Publicación</p>
                <p className="text-sm text-muted-foreground">
                  Opcional. Deja en blanco para publicar ahora.
                </p>
              </div>
              <FormField
                control={form.control}
                name="schedule"
                render={({ field }) => (
                   <FormItem>
                      <FormControl>
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </FormControl>
                   </FormItem>
                )}
              />
              <div className="p-4 border-t flex justify-end">
                 <Button type="submit" disabled={isSaving || isUploading || isEnhancing}>
                   {(isSaving || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                   {form.watch('schedule') ? 'Programar Publicación' : 'Publicar Ahora'}
                 </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </form>
    </Form>
  );
}
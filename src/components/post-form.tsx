'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Bot,
  CalendarIcon,
  Loader2,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import {
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Platform, PostStatus } from '@/lib/types';
import { ALL_PLATFORMS } from '@/lib/types';
import { Icons } from './icons';
import {
  generatePlatformSpecificContent,
} from '@/ai/flows/generate-platform-specific-content';
import {
  getContentImprovementSuggestions,
} from '@/ai/flows/content-improvement-suggestions';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useAuth, useFirestore, useStorage, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from './ui/tooltip';

const CITIES = ['Arica', 'Iquique', 'Antofagasta', 'Calama', 'Tacna'];

const postFormSchema = z.object({
  title: z.string().min(2, {
    message: 'El título debe tener al menos 2 caracteres.',
  }),
  description: z.string().min(10, {
    message: 'La descripción debe tener al menos 10 caracteres.',
  }),
  city: z.string({
    required_error: 'Debes seleccionar una ciudad.',
  }),
  platforms: z.array(z.string()).refine((value) => value.length > 0, {
    message: 'Debes seleccionar al menos una plataforma.',
  }),
  schedule: z.date().optional(),
});

type PostFormValues = z.infer<typeof postFormSchema>;

type GeneratedContent = Partial<Record<Platform, string>>;
type Suggestions = Partial<Record<Platform, string[]>>;

export function PostForm() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState<Platform | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent>({});
  const [suggestions, setSuggestions] = useState<Suggestions>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const router = useRouter();


  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: '',
      description: '',
      platforms: ['facebook', 'instagram'],
    },
  });
  
  const selectedCity = form.watch('city');
  
  const selectedPlatforms = form.watch('platforms') as Platform[];

  async function handleGenerateContent() {
    const draft = form.getValues('description');
    if (!draft || selectedPlatforms.length === 0) {
      toast({
        title: 'Falta Información',
        description:
          'Por favor escribe una descripción y selecciona al menos una plataforma.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedContent({});

    try {
      const platformsToGenerate = selectedPlatforms.filter(p => p !== 'marketplace') as ('facebook' | 'instagram' | 'wordpress')[];
      const promises = platformsToGenerate.map((platform) =>
        generatePlatformSpecificContent({ draft, platform: platform === 'wordpress' ? 'wordpress' : platform.toLowerCase() as 'facebook' | 'instagram' })
      );
      const results = await Promise.all(promises);

      const newContent: GeneratedContent = {};
      results.forEach((result, index) => {
        const platform = platformsToGenerate[index];
        newContent[platform] = result.platformSpecificContent;
      });
      
      // For marketplace, just use the description
      if(selectedPlatforms.includes('marketplace' as any)) {
          newContent['marketplace' as any] = form.getValues('description');
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
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
      if (selectedFile) {
        setIsUploading(true);
        const storageRef = ref(storage, `users/${user.uid}/${Date.now()}-${selectedFile.name}`);
        const uploadTask = await uploadBytes(storageRef, selectedFile);
        mediaUrl = await getDownloadURL(uploadTask.ref);
        setIsUploading(false);
      }
      
      const postData = {
        userId: user.uid,
        title: data.title,
        content: data.description,
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
                <CardTitle>Plantilla</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción del Producto/Servicio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe tu producto o servicio aquí..."
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="platforms"
                  render={({ field }) => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base">Plataformas</FormLabel>
                      </div>
                      <TooltipProvider>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-4">
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
                  className="w-full"
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
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="dropzone-file"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isUploading ? (
                         <Loader2 className="w-8 h-8 mb-4 text-muted-foreground animate-spin" />
                      ) : (
                         <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                      )}
                      {selectedFile ? (
                        <p className="mb-2 text-sm text-primary text-center">{selectedFile.name}</p>
                      ) : (
                        <>
                          <p className="mb-2 text-sm text-muted-foreground text-center">
                            <span className="font-semibold">
                              Haz clic para subir
                            </span>{' '}
                            o arrastra y suelta
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Imagen o Video
                          </p>
                        </>
                      )}
                    </div>
                    <Input
                      id="dropzone-file"
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={isUploading || isSaving}
                    />
                  </label>
                </div>
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
                      Selecciona una ciudad y genera contenido para ver las
                      vistas previas aquí.
                    </p>
                  </div>
                ) : (
                  <Tabs defaultValue={activeTab} className="w-full">
                    <TabsList className={cn("grid w-full", `grid-cols-${selectedPlatforms.length}`)}>
                      {ALL_PLATFORMS.map((platform) => (
                        <TabsTrigger
                          key={platform}
                          value={platform}
                          disabled={!selectedPlatforms.includes(platform)}
                        >
                          {platform === 'wordpress' ? `Revista ${selectedCity || ''}` : platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </TabsTrigger>
                      ))}
                        {selectedPlatforms.includes('marketplace' as any) && (
                            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
                        )}
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
              <Button type="button" variant="critical" disabled={isSaving || isUploading}>
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
                 <Button type="submit" disabled={isSaving || isUploading}>
                   {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                   {form.watch('schedule') ? 'Programar Publicación' : 'Publicar Ahora'}
                 </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </form>
    </Form>
  );

    

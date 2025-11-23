'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState } from 'react';
import {
  Bot,
  CalendarIcon,
  Loader2,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { format } from 'date-fns';

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
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import type { Platform } from '@/lib/types';
import { ALL_PLATFORMS } from '@/lib/types';
import { Icons } from './icons';
import {
  generatePlatformSpecificContent,
} from '@/ai/flows/generate-platform-specific-content';
import {
  getContentImprovementSuggestions,
} from '@/ai/flows/content-improvement-suggestions';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const postFormSchema = z.object({
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters.',
  }),
  draft: z.string().min(10, {
    message: 'Draft must be at least 10 characters.',
  }),
  platforms: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'You have to select at least one platform.',
  }),
  schedule: z.date().optional(),
});

type PostFormValues = z.infer<typeof postFormSchema>;

type GeneratedContent = Partial<Record<Platform, string>>;
type Suggestions = Partial<Record<Platform, string[]>>;

export function PostForm() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState<Platform | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent>({});
  const [suggestions, setSuggestions] = useState<Suggestions>({});
  const { toast } = useToast();

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: '',
      draft: '',
      platforms: [],
    },
  });

  const selectedPlatforms = form.watch('platforms') as Platform[];

  async function handleGenerateContent() {
    const draft = form.getValues('draft');
    if (!draft || selectedPlatforms.length === 0) {
      toast({
        title: 'Missing Information',
        description: 'Please write a draft and select at least one platform.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedContent({});

    try {
      const promises = selectedPlatforms.map((platform) =>
        generatePlatformSpecificContent({ draft, platform })
      );
      const results = await Promise.all(promises);

      const newContent: GeneratedContent = {};
      results.forEach((result, index) => {
        const platform = selectedPlatforms[index];
        newContent[platform] = result.platformSpecificContent;
      });
      setGeneratedContent(newContent);
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: 'AI Generation Failed',
        description:
          'There was an error generating content. Please try again.',
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
        platform: platform.charAt(0).toUpperCase() + platform.slice(1) as 'Facebook' | 'Instagram' | 'WordPress',
        content,
      });
      setSuggestions((prev) => ({ ...prev, [platform]: result.suggestions }));
    } catch (error) {
      console.error('Error getting suggestions:', error);
      toast({
        title: 'Failed to Get Suggestions',
        description: 'There was an error getting suggestions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSuggesting(null);
    }
  }


  function onSubmit(data: PostFormValues) {
    toast({
      title: 'Post Submitted!',
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4 font-code">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
  }

  const activeTab = selectedPlatforms.length > 0 ? selectedPlatforms[0] : undefined;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <Card>
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Post Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Q4 Product Launch" {...field} />
                      </FormControl>
                      <FormDescription>
                        An internal title for your post.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Draft</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="draft"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write your core message here. AI will adapt it for each platform."
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
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base">Platforms</FormLabel>
                        <FormDescription>
                          Select where you want to post.
                        </FormDescription>
                      </div>
                      <div className="space-y-2">
                        {ALL_PLATFORMS.map((item) => (
                          <FormField
                            key={item}
                            control={form.control}
                            name="platforms"
                            render={({ field }) => {
                              const Icon = Icons[item.charAt(0).toUpperCase() + item.slice(1) as keyof typeof Icons];
                              return (
                                <FormItem
                                  key={item}
                                  className="flex flex-row items-center space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([
                                              ...field.value,
                                              item,
                                            ])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== item
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    {item.charAt(0).toUpperCase() + item.slice(1)}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="button" className="w-full" onClick={handleGenerateContent} disabled={isGenerating}>
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Bot className="mr-2 h-4 w-4" />
                  )}
                  Generate for Platforms
                </Button>
              </CardContent>
            </Card>

             <Card>
              <CardHeader>
                <CardTitle>Media</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="flex items-center justify-center w-full">
                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-muted-foreground">Image or Video (MAX. 800x400px)</p>
                        </div>
                        <Input id="dropzone-file" type="file" className="hidden" />
                    </label>
                </div> 
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="min-h-full">
              <CardHeader>
                <CardTitle>Platform Previews</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPlatforms.length === 0 ? (
                  <div className="text-center text-muted-foreground py-20">
                    <Bot className="mx-auto h-12 w-12" />
                    <p className="mt-4">Select a platform and generate content to see previews here.</p>
                  </div>
                ) : (
                <Tabs defaultValue={activeTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                     {ALL_PLATFORMS.map((platform) => (
                      <TabsTrigger key={platform} value={platform} disabled={!selectedPlatforms.includes(platform)}>
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </TabsTrigger>
                     ))}
                  </TabsList>
                  {selectedPlatforms.map(platform => (
                    <TabsContent key={platform} value={platform} className="mt-4 space-y-4">
                      <Textarea 
                        className="min-h-[250px] font-code text-sm" 
                        value={isGenerating ? "Generating..." : (generatedContent[platform] || '')}
                        readOnly={isGenerating}
                        onChange={(e) => setGeneratedContent(p => ({...p, [platform]: e.target.value}))}
                      />

                      <Button type="button" variant="outline" size="sm" onClick={() => handleGetSuggestions(platform)} disabled={isSuggesting === platform}>
                         {isSuggesting === platform ? (
                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                         ) : (
                           <Sparkles className="mr-2 h-4 w-4" />
                         )}
                        Get Suggestions
                      </Button>
                      
                      {suggestions[platform] && (
                        <Alert>
                           <Sparkles className="h-4 w-4" />
                          <AlertTitle>Improvement Suggestions</AlertTitle>
                          <AlertDescription>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                              {suggestions[platform]?.map((s, i) => <li key={i}>{s}</li>)}
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
          <Button variant="outline" type="button">
            Save Draft
          </Button>

           <Popover>
            <PopoverTrigger asChild>
              <Button variant="critical">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Publish / Schedule
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-4 space-y-2">
                 <p className="font-semibold">Schedule Post</p>
                 <p className="text-sm text-muted-foreground">Select a date and time to publish this post.</p>
              </div>
              <Calendar
                mode="single"
                selected={form.watch('schedule')}
                onSelect={(date) => form.setValue('schedule', date)}
                initialFocus
              />
              <div className="p-4 border-t flex justify-end gap-2">
                 <Button variant="outline" type="button">Publish Now</Button>
                 <Button type="submit">Schedule</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </form>
    </Form>
  );
}

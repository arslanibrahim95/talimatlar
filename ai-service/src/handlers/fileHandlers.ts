// File processing handlers for AI service
import { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";

/**
 * Analyze uploaded file
 */
export async function analyzeFile(file: File): Promise<any> {
  // Basic file analysis
  const fileInfo = {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: new Date(file.lastModified)
  };
  
  // For text files, extract content
  if (file.type.startsWith('text/')) {
    const content = await file.text();
    return {
      ...fileInfo,
      content: content.substring(0, 1000), // First 1000 chars
      wordCount: content.split(/\s+/).length,
      analysis: "Metin dosyası analiz edildi."
    };
  }
  
  return {
    ...fileInfo,
    analysis: "Dosya bilgileri alındı."
  };
}

/**
 * Handle file analysis endpoint
 */
export async function handleFileAnalysis(ctx: Context) {
  try {
    const formData = await ctx.request.body({ type: 'form-data' }).value;
    const file = (formData as any).get('file') as File;
    
    if (!file) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Dosya bulunamadı"
      };
      return;
    }
    
    const analysis = await analyzeFile(file);
    
    ctx.response.body = {
      success: true,
      data: analysis
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

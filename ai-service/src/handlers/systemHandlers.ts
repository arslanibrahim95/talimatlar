// System command handlers for AI service
import { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { checkSystemStatus, listUsers, getAnalytics, listInstructions, formatErrorResponse, formatSuccessResponse } from '../utils/common.ts';

/**
 * Execute system command
 */
export async function executeSystemCommand(command: string, sessionId: string, userId: string): Promise<any> {
  const lowerCommand = command.toLowerCase();
  
  try {
    if (lowerCommand.includes('kullanıcı') && lowerCommand.includes('listele')) {
      const users = await listUsers();
      return formatSuccessResponse('user_list', users, `${users.length} kullanıcı bulundu.`);
    } 
    else if (lowerCommand.includes('sistem') && lowerCommand.includes('durum')) {
      const statuses = await checkSystemStatus();
      return formatSuccessResponse('system_status', statuses, 'Sistem durumu kontrol edildi.');
    } 
    else if (lowerCommand.includes('talimat') && lowerCommand.includes('listele')) {
      const instructions = await listInstructions();
      return instructions;
    } 
    else if (lowerCommand.includes('analitik') || lowerCommand.includes('rapor')) {
      const analytics = await getAnalytics();
      return analytics;
    } 
    else {
      return {
        message: "Komut anlaşılamadı. Lütfen daha spesifik bir komut verin.",
        suggestions: [
          "Kullanıcıları listele",
          "Sistem durumunu kontrol et",
          "Talimatları listele",
          "Analitik raporu göster"
        ]
      };
    }
  } catch (error) {
    return formatErrorResponse(error, 'Sistem komutu çalıştırma');
  }
}

/**
 * Handle system command execution endpoint
 */
export async function handleSystemCommand(ctx: Context) {
  try {
    const { command, sessionId, userId } = await ctx.request.body().value;
    
    const result = await executeSystemCommand(command, sessionId, userId);
    
    ctx.response.body = {
      success: true,
      data: result
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

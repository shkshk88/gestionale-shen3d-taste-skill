import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';

@ApiTags('chat')
@Controller('chat')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('case/:caseId')
  @ApiOperation({ summary: 'Get all messages for a case' })
  async getMessages(@Param('caseId') caseId: string) {
    return this.chatService.getMessagesByCaseId(caseId);
  }

  @Post('case/:caseId')
  @ApiOperation({ summary: 'Send a message to a case' })
  async sendMessage(
    @Param('caseId') caseId: string,
    @Body() body: { messageText: string; fileId?: string; annotationData?: any },
    @Req() req: any,
  ) {
    return this.chatService.createMessage({
      caseId,
      senderId: req.user.id,
      messageText: body.messageText,
      messageType: body.fileId ? 'file' : body.annotationData ? 'annotation' : 'text',
      fileId: body.fileId,
      annotationData: body.annotationData,
    });
  }

  @Post('case/:caseId/read')
  @ApiOperation({ summary: 'Mark all messages as read for a case' })
  async markAllAsRead(@Param('caseId') caseId: string, @Req() req: any) {
    await this.chatService.markAllAsRead(caseId, req.user.id);
    return { success: true };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread messages count' })
  async getUnreadCount(@Req() req: any) {
    const count = await this.chatService.getUnreadCount(req.user.id);
    return { count };
  }
}

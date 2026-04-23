import { Controller, Get, Post, Put, Patch, Body, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '@repo/shared';
import { StorageService } from '../storage/storage.service';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly storageService: StorageService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user full profile' })
  @ApiResponse({ status: 200, description: 'Returns the full user profile including role-specific data' })
  async getMe(@Request() req) {
    return this.usersService.findOne(req.user.userId);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Alias for getMe used by mobile app' })
  async getProfile(@Request() req) {
    return this.usersService.findOne(req.user.userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateMe(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.userId, updateUserDto);
  }

  @Put('switch-role')
  @ApiOperation({ summary: 'Switch active user role' })
  @ApiBody({ schema: { type: 'object', properties: { role: { type: 'string', enum: Object.values(UserRole) } } } })
  @ApiResponse({ status: 200, description: 'Active role switched successfully' })
  async switchRole(@Request() req, @Body('role') role: UserRole) {
    return this.usersService.switchRole(req.user.userId, role);
  }

  @Post('add-role')
  @ApiOperation({ summary: 'Add a new role to user' })
  @ApiBody({ schema: { type: 'object', properties: { role: { type: 'string', enum: Object.values(UserRole) } } } })
  @ApiResponse({ status: 201, description: 'New role added successfully' })
  async addRole(@Request() req, @Body('role') role: UserRole) {
    return this.usersService.addRole(req.user.userId, role);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a file (avatar, document)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully', schema: { properties: { url: { type: 'string' } } } })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const url = await this.storageService.uploadFile(file);
    return { url };
  }
}

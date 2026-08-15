import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';

import type {
  Request,
  Response,
} from 'express';

import { JwtService } from '@nestjs/jwt';

import { AuthService } from './auth.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const ACCESS_TOKEN_COOKIE =
  'accessToken';

const COOKIE_MAX_AGE =
  60 * 60 * 1000; // 1 hour

interface AccessTokenPayload {
  sub: string;
  email: string;
  username: string;
}

const isProduction =
  process.env.NODE_ENV === 'production';

const cookieOptions = {
  httpOnly: true,

  secure: isProduction,

  sameSite: isProduction
    ? ('none' as const)
    : ('lax' as const),

  maxAge: COOKIE_MAX_AGE,

  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,

    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  async register(
    @Body()
    registerDto: RegisterDto,

    @Res({ passthrough: true })
    response: Response,
  ) {
    const result =
      await this.authService.register(
        registerDto,
      );

    response.cookie(
      ACCESS_TOKEN_COOKIE,
      result.accessToken,
      cookieOptions,
    );

    return {
      user: result.user,
    };
  }

  @Post('login')
  async login(
    @Body()
    loginDto: LoginDto,

    @Res({ passthrough: true })
    response: Response,
  ) {
    const result =
      await this.authService.login(
        loginDto,
      );

    response.cookie(
      ACCESS_TOKEN_COOKIE,
      result.accessToken,
      cookieOptions,
    );

    return {
      user: result.user,
    };
  }

  @Get('me')
  async getMe(
    @Req()
    request: Request,
  ) {
    const accessToken =
      request.cookies?.[
        ACCESS_TOKEN_COOKIE
      ];

    if (!accessToken) {
      throw new UnauthorizedException(
        'Authentication required',
      );
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<AccessTokenPayload>(
          accessToken,
        );

      if (!payload.sub) {
        throw new UnauthorizedException(
          'Invalid authentication token',
        );
      }

      return this.authService.getCurrentUser(
        payload.sub,
      );
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired authentication token',
      );
    }
  }

  @Post('logout')
  logout(
    @Res({ passthrough: true })
    response: Response,
  ) {
    response.clearCookie(
      ACCESS_TOKEN_COOKIE,
      {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction
          ? ('none' as const)
          : ('lax' as const),
        path: '/',
      },
    );

    return {
      message:
        'Logged out successfully',
    };
  }
}
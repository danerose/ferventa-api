import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user || !user.role) {
      throw new ForbiddenException('No tienes permisos para realizar esta acción');
    }

    const roleName = typeof user.role === 'string' ? user.role : user.role?.name;
    const permissions: string[] = user.role?.permissions || [];

    // Admin or wildcard permissions have full access
    if (
      (roleName && roleName.toLowerCase() === 'admin') ||
      permissions.includes('*')
    ) {
      return true;
    }

    // Extensible Check: Matches the role name (e.g., 'admin', 'seller', 'warehouse')
    const hasRole =
      roleName &&
      requiredRoles.some(
        (r) => r.toLowerCase() === roleName.toLowerCase(),
      );
    
    if (!hasRole) {
      throw new ForbiddenException('No tienes permisos suficientes (rol requerido)');
    }

    return true;
  }
}

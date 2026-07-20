import { CanActivate, ExecutionContext, Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class BranchGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const branchId = request.headers['x-branch-id'];
    const user = request.user;
    const i18n = I18nContext.current();

    if (!branchId) {
      throw new BadRequestException(
        i18n ? i18n.t('common.errors.branchIdRequired') : 'El header x-branch-id es obligatorio para esta petición'
      );
    }

    if (!user) {
      return false; // Should be authenticated before this guard
    }

    // Check if user has access to this branch
    const hasAccess = user.branches && user.branches.includes(branchId);
    
    // If admin has a wildcard permission or explicit access, allow it.
    // For now, we assume if you are admin with '*' you have access to all branches.
    const isAdmin = user.role && user.role.permissions && user.role.permissions.includes('*');

    if (!hasAccess && !isAdmin) {
      throw new ForbiddenException(
        i18n ? i18n.t('common.errors.branchAccessDenied') : 'No tienes acceso a esta sucursal'
      );
    }

    // Inject branchId into request for easy access in controllers
    request.branchId = branchId;
    return true;
  }
}

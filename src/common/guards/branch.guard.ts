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
    const userBranchIds: string[] = (user.branches || []).map((b: any) =>
      b?._id ? b._id.toString() : b?.toString ? b.toString() : String(b),
    );
    const hasAccess = userBranchIds.includes(branchId.toString());

    const roleName = typeof user.role === 'string' ? user.role : user.role?.name;
    const permissions: string[] = user.role?.permissions || [];
    const isAdmin =
      (roleName && roleName.toLowerCase() === 'admin') ||
      permissions.includes('*');

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

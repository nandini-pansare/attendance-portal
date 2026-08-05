import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permissions } from '../common/permissions/permissions'; // adjust path to wherever your Permissions map lives
import { UserRole } from '../common/enums/role.enum';

@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());

        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        const req = context.switchToHttp().getRequest();
        // Support role coming from either req.user (JWT) or req.session (session-based)
        const role = req.user?.role ?? req.session?.role;

        if (!role) {
            throw new ForbiddenException('No role found on request');
        }

        const roleKey = String(role).toUpperCase().trim();

        const allowedPermissionsRaw = Permissions[roleKey] || [];
        const allowedPermissions = allowedPermissionsRaw.map(p => String(p).toUpperCase().trim());

        const requiredNormalized = requiredPermissions.map(p => String(p).toUpperCase().trim());

        const hasPermission = requiredNormalized.some((perm) =>
            allowedPermissions.includes(perm),
        );

        if (!hasPermission) {
            throw new ForbiddenException(`Role '${role}' does not have permission for this action`);
        }

        return true;
    }
}
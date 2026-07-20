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
        const role: UserRole = req.user?.role;

        if (!role) {
            throw new ForbiddenException('No role found on request');
        }

        const allowedPermissions = Permissions[role.toUpperCase()] || [];

        const hasPermission = requiredPermissions.some((perm) =>
            allowedPermissions.includes(perm),
        );

        if (!hasPermission) {
            throw new ForbiddenException(`Role '${role}' does not have permission for this action`);
        }

        return true;
    }
}
import { Hookable, HookController, IHookController } from '@motajs/common';
import { IHeroFollower, IHeroState, IHeroStateHooks } from './types';
import { FaceDirection, getFaceMovement, nextFaceDirection } from '../common';
import { isNil } from 'lodash-es';
import { DEFAULT_HERO_IMAGE } from '../shared';

export class HeroState extends Hookable<IHeroStateHooks> implements IHeroState {
    x: number = 0;
    y: number = 0;
    direction: FaceDirection = FaceDirection.Down;
    image: ImageIds = DEFAULT_HERO_IMAGE;

    /** 当前勇士是否正在移动 */
    moving: boolean = false;
    alpha: number = 1;

    readonly followers: IHeroFollower[] = [];

    protected createController(
        hook: Partial<IHeroStateHooks>
    ): IHookController<IHeroStateHooks> {
        return new HookController(this, hook);
    }

    setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
        this.forEachHook(hook => {
            hook.onSetPosition?.(x, y);
        });
    }

    turn(direction?: FaceDirection): void {
        const next = isNil(direction)
            ? nextFaceDirection(this.direction)
            : direction;
        this.direction = next;
        this.forEachHook(hook => {
            hook.onTurnHero?.(next);
        });
    }

    startMove(): void {
        this.moving = true;
        this.forEachHook(hook => {
            hook.onStartMove?.();
        });
    }

    async move(dir: FaceDirection, time: number = 100): Promise<void> {
        await Promise.all(
            this.forEachHook(hook => {
                return hook.onMoveHero?.(dir, time);
            })
        );
        const { x, y } = getFaceMovement(dir);
        this.x += x;
        this.y += y;
    }

    async endMove(): Promise<void> {
        if (!this.moving) return;
        await Promise.all(
            this.forEachHook(hook => {
                return hook.onEndMove?.();
            })
        );
        this.moving = false;
    }

    async jumpHero(
        x: number,
        y: number,
        time: number = 500,
        waitFollower: boolean = false
    ): Promise<void> {
        await Promise.all(
            this.forEachHook(hook => {
                return hook.onJumpHero?.(x, y, time, waitFollower);
            })
        );
        this.x = x;
        this.y = y;
    }

    setImage(image: ImageIds): void {
        this.image = image;
        this.forEachHook(hook => {
            hook.onSetImage?.(image);
        });
    }

    setAlpha(alpha: number): void {
        this.alpha = alpha;
        this.forEachHook(hook => {
            hook.onSetAlpha?.(alpha);
        });
    }

    setFollowerAlpha(identifier: string, alpha: number): void {
        const follower = this.followers.find(v => v.identifier === identifier);
        if (!follower) return;
        follower.alpha = alpha;
        this.forEachHook(hook => {
            hook.onSetFollowerAlpha?.(identifier, alpha);
        });
    }

    addFollower(follower: number, identifier: string): void {
        this.followers.push({ num: follower, identifier, alpha: 1 });
        this.forEachHook(hook => {
            hook.onAddFollower?.(follower, identifier);
        });
    }

    removeFollower(identifier: string, animate: boolean = false): void {
        const index = this.followers.findIndex(
            v => v.identifier === identifier
        );
        if (index === -1) return;
        this.followers.splice(index, 1);
        this.forEachHook(hook => {
            hook.onRemoveFollower?.(identifier, animate);
        });
    }

    removeAllFollowers(): void {
        this.followers.length = 0;
        this.forEachHook(hook => {
            hook.onRemoveAllFollowers?.();
        });
    }
}

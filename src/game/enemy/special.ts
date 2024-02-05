export interface SpecialDeclaration {
    code: number;
    name: string | ((enemy: Enemy) => string);
    desc: string | ((enemy: Enemy) => string);
    color: string;
}

export const specials: SpecialDeclaration[] = [];

export type AccessModifier = '+' | '-' | '#';

interface Variable {
    name: string;
    type: string;
}

interface Attribute extends Variable {
    access: string;
}
interface Operation {
    name: string;
    access: string;
    params: Variable[];
    returnType: string;

}

export interface UMLClass {
    className: string;
    attributes: Attribute[];
    operations: Operation[];
}
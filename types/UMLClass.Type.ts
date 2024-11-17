interface UMLObject {
    id: number;
    shape: string
}

export interface UMLClass extends UMLObject {
    name: string;
    attributes: Attribute[];
    methods: Method[];
    position: {
        x: number,
        y: number
    }
}

export interface Attribute {
    id: number;
    visibility: string;
    name: string;
    type: string;
}

export interface Method {
    id: number;
    visibility: string;
    name: string;
    returnType: string;
    parameters: Parameter[];
}

export interface Parameter {
    id: number;
    name: string;
    type: string;
}

export interface UMLAssociation extends UMLObject {
    source: number;
    target: number;
    label?: string;
}

export interface Diagram {
    id: string;
    uml_classes: UMLClass[];
    uml_association: UMLAssociation[];
    
}

export interface Project {
    id: string;
    project_name: string;
    project_snippet: string;
    created_at: string;
    updated_at: string;
    diagram?: Diagram| null;
}
export interface User {
    id: string;
    username: string;
    email: string;
    projects: Project;
}


// The available shape options are:

// class: Represents a class.
// extends: Represents an inheritance relationship.
// composition: Represents a composition relationship (strong ownership).
// aggregation: Represents an aggregation relationship (looser ownership).
// association: Represents a general association between classes.
// implement: Represents a class implementing an interface.
// interface: Represents an interface.



interface UMLObject {
    id: number;
    shape: 
    "class" | 
    "extends" | 
    "composition" | 
    "aggregation" | 
    "association" |
    "implement" |
    "interface";
}

export interface UMLClass extends UMLObject {
    name: string[];
    attributes: string[];
    methods: string[];
    position: {
        x: number,
        y: number
    }
}

export interface UMLAssociation extends UMLObject {
    source: number;
    target: number;
}


// The available shape options are:

// class: Represents a class.
// extends: Represents an inheritance relationship.
// composition: Represents a composition relationship (strong ownership).
// aggregation: Represents an aggregation relationship (looser ownership).
// association: Represents a general association between classes.
// implement: Represents a class implementing an interface.
// interface: Represents an interface.



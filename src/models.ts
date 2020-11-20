
export type ClassDef = {
  "fullClassName": string;
  "package": string;
  "description": string;
  "hierarchy": HierarchyClass[];
  constants: {
    [name: string]: ConstantDef;
  };
  properties: {
    [name: string]: PropertyDef;
  };
  constructors: {
    [name: string]: ConstructorDef;
  };
  methods: {
    [name: string]: MethodDef;
  };
}

export type HierarchyClass = {
  name: string;
}

export type ConstantDef = {
  name: string;
  value: string;
  description: string;
  deprecated: boolean;
  type: 'constant';
  class: {
    name: string;
  }
}


export type PropertyDef = {
  name: string;
}

export type ConstructorDef = {
  name: string;
  description: string;
  deprecated: boolean;
  class: {
    description: string;
  }
  args: MethodArg[];
}

export type MethodArg = {
  "name": string;
  "description": string;
  "class": {
    "name": string;
  },
  "multiple": boolean;

}

export type MethodDef = {
  name: string;
  class: {
    name: string;
    generics?: string;
  }
  args: MethodArg[];
  static?: boolean;
}
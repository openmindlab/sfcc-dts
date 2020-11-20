
export type ClassDef = {
  fullClassName: string;
  package: string;
  description: string;
  hierarchy: HierarchyClass[];
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
  class: ClassType;
}


export type PropertyDef = {
  name: string;
  class: ClassType;
  static: boolean;
  readonly: boolean;
}

export type ConstructorDef = {
  name: string;
  description: string;
  deprecated: boolean;
  class: ClassType;
  args: MethodArg[];
}

export type MethodArg = {
  name: string;
  description: string;
  class: ClassType;
  multiple: boolean;
}

export type ClassType = {
  name: string;
  description?: string;
  generics?: string;
}

export type MethodDef = {
  name: string;
  class: ClassType;
  args: MethodArg[];
  static?: boolean;
}

export type CustomAttr = {
  name: string;
  extends?: string;
}
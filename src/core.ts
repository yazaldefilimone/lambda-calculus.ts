enum Kind {
  Application = 'application',
  Abstraction = 'abstraction',
  Variable = 'variable',
}
type VariableType = string;
type MaybeType<T> = T | any;
type FreeVariableType = VariableType;

type AbstractionType = Readonly<{
  kind: Kind.Abstraction;
  parameter: BoundVariableType;
  body: LambdaType;
  toString: () => string;
}>;

type ApplicationType = Readonly<{
  kind: Kind.Application;
  function: LambdaType;
  argument: LambdaType;
  toString: () => string;
}>;

type LambdaType = FreeVariableType | ApplicationType | AbstractionType;
//                       x               | x(y)        | [λ˚x.y(˚x)]

type BoundVariableType = `*${VariableType}`;

function isBoundVariable(variable: MaybeType<VariableType>): boolean {
  return typeof variable === 'string' && variable.startsWith('*');
}

function _variableFn(name: string, free?: true): FreeVariableType;
function _variableFn(name: string, free?: false): BoundVariableType;
function _variableFn(name: string, free?: undefined): FreeVariableType;
function _variableFn(name: string, free?: boolean): VariableType {
  free = free ?? true;
  name = name.replace(/^\*/, '');
  return free ? name : `*${name}`;
}

function _toString(this: AbstractionType | ApplicationType): string {
  switch (this.kind) {
    case Kind.Abstraction:
      return `λ${this.parameter}.${this.body.toString()}`;
    case Kind.Application:
      return `${this.function.toString()}(${this.argument.toString()})`;
    default:
      // So TypeScript knows undefined will never be implicitly returned by the function.
      const nothing: never = this;
      return nothing;
  }
}

function _apply(fn: LambdaType, arg: LambdaType): ApplicationType {
  return {
    kind: Kind.Application,
    function: fn,
    argument: arg,
    toString: _toString,
  };
}

function _substitution(
  expression: LambdaType,
  replace: VariableType,
  substitute: LambdaType | BoundVariableType,
): LambdaType {
  if (typeof expression === 'string') {
    if (!isBoundVariable(replace) && !isBoundVariable(substitute) && expression === replace) {
      throw new Error('Cannot substitute a free variable with another free variable');
    }
    return expression === replace ? substitute : expression;
  }

  if (expression.kind === Kind.Abstraction) {
    if (expression.parameter === replace) {
      return expression;
    }
    return {
      ...expression,
      body: _substitution(expression.body, replace, substitute),
    };
  }

  if (expression.kind === Kind.Application) {
    return {
      ...expression,
      function: _substitution(expression.function, replace, substitute),
      argument: _substitution(expression.argument, replace, substitute),
    };
  }
  // So TypeScript knows undefined will never be implicitly returned by the function.
  const nothing: never = expression;
  return nothing;
}

function apply(...args: LambdaType[]): Readonly<ApplicationType> {
  if (args.length < 2) {
    throw new Error('apply requires at least two arguments');
  }

  const expression = args.reduce((acc, curr) => _apply(acc, curr));

  return expression as ApplicationType;
}

function abstract(variable: FreeVariableType, body: LambdaType): AbstractionType {
  const parameter = _variableFn(variable, false);
  body = _substitution(body, variable, parameter);
  return {
    kind: Kind.Abstraction,
    parameter,
    body,
    toString: _toString,
  };
}

const xBoundVariable = _variableFn('x', false);

// some variables
const x = 'x';
const y = 'y';
const z = 'z';
const w = 'w';
const f = 'f';
const g = 'g';
const h = 'h';


try {
  
console.log(apply(x, y, apply(z, w)).toString());
// λx.λy.x(λz.z(w))
console.log(apply(f, x).toString());
// f(x)
console.log(abstract(x, apply(f, x)).toString());
// λx.f(x)
console.log(abstract(f, apply(f, x)).toString());
// λf.f(f(x))

console.log(
    apply(x, abstract(f, abstract(x, apply(f, x, y))), z, w).toString()
);
// λx.λf.λx.x(f(x, y))(z, w)

} catch (error:any) {
  console.error("Error: " +error.message);
}
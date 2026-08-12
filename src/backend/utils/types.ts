
export type Email = string & { __brand: 'Email' }

export interface User {
    readonly id: number;
    name: string;
    email: Email;
    password: string;
    createdAt: Date;
    updatedAt: Date;
}
type Phone_number = string & { __brand: 'Phone_number' };
export type UserPick = Pick<User, "name" | "email" | "password">

export interface UserProfile {
    readonly id: number;
    name:UserPick["name"];
    email:UserPick["email"];
    phone:Phone_number;
    avatar?: string;
    createdAt: Date;
    updatedAt: Date;
}

type CategoryMovements = "Operaciones" | "Servicios" | "Nómina" | "Imprevistos" | "Ventas" | "Otros"

export type UserMovements = {
    readonly userId: string;
    mount: number;
    description: string;
    type: "ingreso" | "egreso";
    category: CategoryMovements;
    currency?: string;
    createdAt: Date;
    updatedAt: Date;
}
export type MessageError = {
    message: string;
    code: number;
    url: string;
}
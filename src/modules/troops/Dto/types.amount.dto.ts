export class TypesDto {
  type: string;
  amount: number;

  constructor(typeData: any) {
    this.type = typeData.type;
    this.amount = typeData.amount;
  }
}
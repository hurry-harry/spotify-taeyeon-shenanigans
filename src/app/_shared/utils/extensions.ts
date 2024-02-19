export { }

declare global {
  
  interface String {
    normalizeString(): string;
  }
}

String.prototype.normalizeString = function(): string {
  return this.toLocaleLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
};
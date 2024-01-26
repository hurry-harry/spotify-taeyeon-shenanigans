import { Pipe, PipeTransform } from "@angular/core";

@Pipe({ name: "singleEP", standalone: true })
export class SingleEpPipe implements PipeTransform {
  transform(value: string): string {
    if (value === "Single") 
      return "Single/EP"

    return value;
  }
}
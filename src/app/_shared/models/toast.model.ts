import { TemplateRef } from "@angular/core";

export interface Toast {
	message: string;
	classname?: string;
	delay?: number;
}
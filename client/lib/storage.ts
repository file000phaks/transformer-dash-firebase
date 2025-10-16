import { Transformer } from "@/types/transformer";

const KEY = "guard.transformers";

export function loadTransformers(): Transformer[] {

  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Transformer[]) : [];
  } 
  
  catch {
    return [];
  }

}

export function saveTransformers(list: Transformer[]) {

  localStorage.setItem(KEY, JSON.stringify(list));
  
}

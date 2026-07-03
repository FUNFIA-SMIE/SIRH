import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
export type TypeCongeEnum =
  | 'ANNUEL'
  | 'MALADIE'
  | 'MATERNITE'
  | 'PATERNITE'
  | 'EXCEPTIONNEL'
  | 'SANS_SOLDE';
 
export interface TypeConge {
  id?:                  string;
  organisation_id?:     string;
  code:                 string;
  libelle:              string;
  type_enum:            TypeCongeEnum;
  solde_initial_jours:  number;
  validation_rh:        boolean;
  seuil_rh_jours?:      number | null;
  delai_reponse_h:      number;
  anticipation_min_j:   number;
  justificatif_requis:  boolean;
  deductible_solde:     boolean;
  actif:                boolean;
  created_at?:          string;
}
 
export interface TypeEnumOption {
  value: TypeCongeEnum;
  label: string;
}
@Injectable({
  providedIn: 'root',//
})
export class ServiceTypeCongeService {
    private readonly base = 'http://192.168.88.2000:3335/conges';
    //private readonly base = 'http://localhost:3335/conges';

  constructor(private http: HttpClient) {}
 
  getAll(): Observable<TypeConge[]> {
    return this.http.get<TypeConge[]>(`${this.base}/types-conge`);
  }
 
  getOne(id: string): Observable<TypeConge> {
    return this.http.get<TypeConge>(`${this.base}/${id}`);
  }
 
  create(payload: TypeConge): Observable<TypeConge> {
    return this.http.post<TypeConge>(`${this.base}/types-conge`, payload);
  }
 
  update(id: string, payload: Partial<TypeConge>): Observable<TypeConge> {
    return this.http.put<TypeConge>(`${this.base}/types-conge/${id}`, payload);
  }
 
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/types-conge/${id}`);
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ServiceSirhService {

  private url = 'http://localhost:3000';


  constructor(private http: HttpClient) { }

  getAllEmployees() {

    return this.http.get(`${this.url}/employes`)
  }

  async getEmployeeById(id: number) {
    const response = await fetch(`${this.url}/employes/${id}`);
    return await response.json();
  }

  async createEmployee(employee: any) {
    const response = await fetch(`${this.url}/employes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employee),
    });
    return await response.json();
  }


  updateEmployee(id: number, employee: any) {
    return fetch(`${this.url}/employes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employee),
    }).then((response) => response.json());
  }

  deleteEmployee(id: number) {
    return fetch(`${this.url}/employes/${id}`, {
      method: 'DELETE',
    }).then((response) => response.json());
  }

  // Department methods
  getAllDepartments(): Observable<any> {
    return this.http.get(`${this.url}/departements`);
  }

  createDepartment(department: any) {
    return this.http.post(`${this.url}/departements`, department);
  }


  getDepartmentById(id: number) {
    return this.http.get(`${this.url}/departements/${id}`)
  }

  updateDepartment(id: any, department: any) {
    return fetch(`${this.url}/departements/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(department),
    }).then((response) => response.json());

  }

  deleteDepartment(id: number) {
    return fetch(`${this.url}/departements/${id}`, {
      method: 'DELETE',
    }).then((response) => response.json());
  }

  nouveauDepartement(department: any) {
    return fetch(`${this.url}/departements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(department),
    }).then((response) => response.json());
  }

  NouveauPoste(poste: any): Observable<any> {
    // HttpClient.post retourne un Observable par défaut
    return this.http.post(`${this.url}/postes`, poste);
  }
  modifierPoste(id: string, poste: any): Observable<any> {
    return this.http.patch(`${this.url}/postes/${id}`, poste);
  }

  deletePoste(id: number) {
    return this.http.delete(`${this.url}/postes/${id}`);
  }

  getAllPostes(): Observable<any> {
    return this.http.get(`${this.url}/postes`);
  }

  getPosteById(id: number) {
    return this.http.get(`${this.url}/postes/${id}`)
  }


}

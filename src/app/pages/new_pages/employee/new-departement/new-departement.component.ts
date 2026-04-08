import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ServiceSirhService } from '../../../../services/service-sirh.service';

@Component({
  selector: 'app-new-departement',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './new-departement.component.html',
  styleUrl: './new-departement.component.css',
})
export class NewDepartementComponent implements OnInit {

  departmentForm: FormGroup;
  departments: any;
  employees: any;
  editMode = false;
  currentDepartmentId: number | null = null;

  constructor(private router: Router, private route: ActivatedRoute, private sirhService: ServiceSirhService) {
    this.departmentForm = new FormGroup({
      code: new FormControl('', Validators.required),
      nom: new FormControl('', Validators.required),
      parent_id: new FormControl(null),
      responsable_id: new FormControl(''),
      /*
      budget_annuel: new FormControl('', [Validators.required, Validators.min(0)]),
      effectif_max: new FormControl('', [Validators.required, Validators.min(1)])
    */
    });
  }

  ngOnInit() {

    this.route.queryParams.subscribe(params => {
      const id = params['id'];
      console.log('ID reçu :', id);

      if (id) {
        this.editMode = true;
        this.currentDepartmentId = id;

        this.sirhService.getDepartmentById(id).subscribe({
          next: (department: any) => {

            console.log('Département récupéré pour modification :', department);

            if (department) {
              this.departmentForm.patchValue({
                code: department.code || '',
                nom: department.nom || '',
                parent_id: department.parent_id || null,
                responsable_id: department.responsable_id || null,
                budget_annuel: department.budget_annuel || 0,
                effectif_max: department.effectif_max || 0,
              });

              console.log('Formulaire pré-rempli pour modification :', this.departmentForm.value);
            }
          },
          error: (error) => {
            console.error('Impossible de récupérer le département pour modification', error);
          },
        });
      }
    });

    this.loadDepartments();
    this.loadEmployees();
    this.checkEditMode();


  }

  checkEditMode() {
    this.route.queryParams.subscribe((params) => {
      const idParam = params['id'];
      if (idParam) {
        const id = Number(idParam);
        if (!isNaN(id)) {
          this.editMode = true;
          this.currentDepartmentId = id;
          this.sirhService.getDepartmentById(id).subscribe({
            next: (department: any) => {
              if (department) {
                this.departmentForm.patchValue({
                  code: department.code || department.code_departement || '',
                  nom: department.nom || department.nom_departement || '',
                  parent_id: department.parent_id || null,
                  responsable_id: department.responsable_id || null,
                  budget_annuel: department.budget_annuel || 0,
                  effectif_max: department.effectif_max || 0,
                });
              }
            },
            error: (error) => {
              console.error('Impossible de récupérer le département pour modification', error);
            },
          });
        }
      }
    });
  }

  loadDepartments() {
    this.sirhService.getAllDepartments().subscribe({
      next: (data) => {
        this.departments = data;
        console.log('Departments loaded:', this.departments);
      },
      error: (error) => {
        console.error('Error loading departments:', error);
      }
    });
  }

  loadEmployees() {
    this.sirhService.getAllEmployees().subscribe({
      next: (data) => {
        this.employees = data;
        console.log('Employees loaded:', this.employees);
      },
      error: (error) => {
        console.error('Error loading employees:', error);
      }
    });
  }

  cancel() {
    this.router.navigate(['/departement']);
  }

  onSubmit() {
    if (this.departmentForm.valid) {
      const formValue = this.departmentForm.value;
      const department = {
        organisation_id: '0226b11d-fa98-499c-a856-37f919df0fa5', // Placeholder UUID for organisation
        parent_id: formValue.parent_id || null,
        code: formValue.code,
        nom: formValue.nom,
        description: '', // No description in form
        responsable_id: formValue.responsable_id,
        budget_annuel: parseFloat(formValue.budget_annuel),
        effectif_max: parseInt(formValue.effectif_max, 10)
      };

      console.log('Creating department:', department);

/*
      this.route.queryParams.subscribe((params) => {
        const idParam = params['id'];
        if (idParam) {
          const id = Number(idParam);
          if (!isNaN(id)) {
            this.editMode = true;
            this.currentDepartmentId = id;
            console.log('Edit mode activated for department ID:', id);
          }
        }
      });
*/


      if (this.editMode && this.currentDepartmentId) {
        this.sirhService.updateDepartment(this.currentDepartmentId, department)
          .then((response) => {
            console.log('Department updated:', response);
            this.router.navigate(['/departement']);
          })
          .catch((error) => {
            console.error('Error updating department:', error);
          });
      } else {
        this.sirhService.createDepartment(department).subscribe({
          next: (response) => {
            console.log('Department created:', response);
            this.router.navigate(['/departement']);
          },
          error: (error) => {
            console.error('Error creating department:', error);
          }
        });
      }

    }
  }

}

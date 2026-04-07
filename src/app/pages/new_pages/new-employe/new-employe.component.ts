import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ServiceSirhService } from '../../../services/service-sirh.service';

@Component({
  selector: 'app-new-employe',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './new-employe.component.html',
  styleUrl: './new-employe.component.css',
})
export class NewEmployeComponent implements OnInit {
  JSON = JSON; // Expose JSON to template

  isPreviewModalOpen: boolean = false;
  data_departement: any[] = [];
  data_postes: any[] = [];
  data_employe: any;
  photoBase64: string = ''; // Store photo as base64
  photoPreview: string = ''; // Store photo preview URL
  cvBase64: string = ''; // Store CV as base64
  cvFileName: string = ''; // Store CV file name
  
  constructor(private service: ServiceSirhService, private cdr: ChangeDetectorRef) { }

  openPreview() {
    this.isPreviewModalOpen = true;
  }

  closePreview() {
    this.isPreviewModalOpen = false;
  }

  onPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image valide');
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('L\'image ne doit pas dépasser 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.photoBase64 = e.target.result; // Store as base64
        this.photoPreview = e.target.result; // Use for preview
        this.cdr.detectChanges(); // Force change detection
      };
      reader.readAsDataURL(file);
    }
  }

  onCVSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Check if file is PDF or DOC
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        alert('Veuillez sélectionner un fichier PDF ou Word (.pdf, .doc, .docx)');
        return;
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Le fichier ne doit pas dépasser 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.cvBase64 = e.target.result; // Store as base64
        this.cvFileName = file.name; // Store file name
        this.cdr.detectChanges(); // Force change detection
      };
      reader.readAsDataURL(file);
    }
  }

  async ngOnInit(): Promise<void> {

    this.data_departement = await this.service.getAllDepartments().toPromise();
    this.data_postes =  await this.service.getAllPostes().toPromise();
    this.data_employe = await this.service.getAllEmployees().toPromise();

    console.log(this.data_departement);
    console.log(this.data_postes);
    console.log(this.data_employe);

  }
}

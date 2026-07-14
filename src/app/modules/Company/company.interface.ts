// id string [pk]
//   owner string [ref: > User.id]              // The User who created/owns this provider account
//   companyName string
//   companyCode string [unique]
//   qrCode string [unique]
//   city string
//   serviceArea string
//   fleetSize number
//   notes text
//   ratePerRide number [default: 2.0]          // Custom commission rate per ride for this company
//   createdAt timestamp
//   updatedAt timestamp

import { Types } from "mongoose";

interface ICompany {
   user: Types.ObjectId;
   companyName: string;
   companyCode: string;
   qrCode: string;
   city: string;
   serviceArea: string;
   fleetSize: number;
   notes: string;
}

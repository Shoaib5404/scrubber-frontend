/** Dropdown options aligned with neo-scrubber config/common.php */

export const GENDER_OPTIONS = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
  { value: 'U', label: 'Unknown' },
] as const;

export const SUBMISSION_METHOD_OPTIONS = [
  { value: 'Electronic', label: 'Electronic' },
  { value: 'Paper', label: 'Paper' },
] as const;

export const PAYER_RESPONSIBILITY_OPTIONS: Record<string, string> = {
  P: 'Primary',
  S: 'Secondary',
  T: 'Tertiary',
  A: 'Payer Responsibility Four',
  B: 'Payer Responsibility Five',
  C: 'Payer Responsibility Six',
  D: 'Payer Responsibility Seven',
  E: 'Payer Responsibility Eight',
  F: 'Payer Responsibility Nine',
  G: 'Payer Responsibility Ten',
  H: 'Payer Responsibility Eleven',
  U: 'Unknown',
};

export const RELATIONSHIP_OPTIONS: Record<string, string> = {
  '01': 'Spouse',
  '18': 'Self',
  '19': 'Child',
  '20': 'Employee',
  '21': 'Unknown',
  '39': 'Organ Donor',
  '40': 'Cadaver Donor',
  '53': 'Life Partner',
  G8: 'Other Relationship',
};

export const CLAIM_FILING_INDICATORS: Record<string, string> = {
  '09': 'Self-pay',
  '11': 'Other Non-Federal Programs',
  '12': 'Preferred Provider Organization (PPO)',
  '13': 'Point of Service (POS)',
  '14': 'Exclusive Provider Organization (EPO)',
  '15': 'Indemnity Insurance',
  '16': 'Health Maintenance Organization (HMO) Medicare Risk',
  AM: 'Automobile Medical',
  BL: 'Blue Cross/Blue Shield',
  CH: 'CHAMPUS',
  CI: 'Commercial Insurance Co.',
  DS: 'Disability',
  FI: 'Federal Employee Program',
  HM: 'Health Maintenance Organization',
  LI: 'Liability',
  LM: 'Liability Medical',
  MA: 'Medicare Part A',
  MB: 'Medicare Part B',
  MC: 'Medicaid',
  OF: 'Other Federal Program',
  TV: 'Title V',
  VA: 'Veteran Administration Plan',
  WC: "Workers' Compensation Health Claim",
  ZZ: 'Mutually Defined Unknown',
};

/** Full CMS place-of-service list from neo-scrubber config/common.php. */
export const PLACES_OF_SERVICE: Record<string, string> = {
  '01': 'Pharmacy',
  '02': "Telehealth Provided Other than in Patient's Home",
  '03': 'School',
  '04': 'Homeless Shelter',
  '05': 'Indian Health Service Free-standing Facility',
  '06': 'Indian Health Service Provider-based Facility',
  '07': 'Tribal 638 Free-standing Facility',
  '08': 'Tribal 638 Provider-based Facility',
  '09': 'Prison / Correctional Facility',
  '10': "Telehealth Provided in Patient's Home",
  '11': 'Office',
  '12': 'Home',
  '13': 'Assisted Living Facility',
  '14': 'Group Home',
  '15': 'Mobile Unit',
  '16': 'Temporary Lodging',
  '17': 'Walk-in Retail Health Clinic',
  '18': 'Place of Employment / Worksite',
  '19': 'Off-Campus Outpatient Hospital',
  '20': 'Urgent Care Facility',
  '21': 'Inpatient Hospital',
  '22': 'On-Campus Outpatient Hospital',
  '23': 'Emergency Room - Hospital',
  '24': 'Ambulatory Surgical Center',
  '25': 'Birthing Center',
  '26': 'Military Treatment Facility',
  '27': 'Outreach Site / Street',
  '31': 'Skilled Nursing Facility (SNF)',
  '32': 'Nursing Facility',
  '33': 'Custodial Care Facility',
  '34': 'Hospice',
  '41': 'Ambulance - Land',
  '42': 'Ambulance - Air or Water',
  '49': 'Independent Clinic',
  '50': 'Federally Qualified Health Center (FQHC)',
  '51': 'Inpatient Psychiatric Facility',
  '52': 'Psychiatric Facility - Partial Hospitalization',
  '53': 'Community Mental Health Center',
  '54': 'Intermediate Care Facility for Individuals with Intellectual Disabilities',
  '55': 'Residential Substance Abuse Treatment Facility',
  '56': 'Psychiatric Residential Treatment Center',
  '57': 'Non-residential Substance Abuse Treatment Facility',
  '60': 'Mass Immunization Center',
  '61': 'Comprehensive Inpatient Rehabilitation Facility',
  '62': 'Comprehensive Outpatient Rehabilitation Facility',
  '65': 'End-Stage Renal Disease Treatment Facility',
  '66': 'PACE Center',
  '71': 'State or Local Public Health Clinic',
  '72': 'Rural Health Clinic',
  '81': 'Independent Laboratory',
  '99': 'Other Place of Service',
};

/** neo-scrubber config/common.php `ncci_bypass_modifiers` — modal list. */
export const NCCI_BYPASS_MODIFIERS: readonly string[] = [
  '73',
  '74',
  'GW',
  'XU',
  'XS',
  'XP',
  'XE',
  'RT',
  'QJ',
  'Q6',
  'Q5',
  'PD',
  'LT',
  'KX',
  'GR',
  'GJ',
  'GC',
  'GA',
  'ET',
  'E4',
  'E3',
  'E2',
  'E1',
  'AR',
  'AQ',
  '99',
  '79',
  '78',
  '77',
  '76',
  '59',
  '58',
  '56',
  '55',
  '54',
  '53',
  '52',
  '51',
  '22',
  'GV',
];

export const NCCI_BYPASS_HELP_INTRO =
  'An NCCI-associated modifier may be applied to override this edit when appropriate.';

export const CERUMEN_REMOVAL_PROCEDURE_CODES = ['69209', '69210', 'G0268'] as const;
export const CERUMEN_ALLOWED_ICD_DISPLAY = [
  'H61.2',
  'H61.20',
  'H61.21',
  'H61.22',
  'H61.23',
] as const;

export const NDC_UNIT_OPTIONS = ['UN', 'ML', 'GR', 'F2', 'ME'] as const;
export const UNIT_SCALE_OPTIONS = ['UN', 'MJ', 'F2'] as const;

export const CLAIM_LEVEL_DATE_FIELDS: Array<{ key: string; label: string }> = [
  { key: 'onset_of_illness_date', label: 'Onset of Illness (DTP*431)' },
  { key: 'last_menstrual_period_date', label: 'Last Menstrual Period (DTP*484)' },
  { key: 'initial_treatment_date', label: 'Initial Treatment (DTP*454)' },
  { key: 'last_seen_date', label: 'Last Seen (DTP*304)' },
  { key: 'accident_date', label: 'Accident (DTP*439)' },
  { key: 'last_xray_date', label: 'Last X-Ray (DTP*455)' },
  { key: 'admission_date', label: 'Admission (DTP*435)' },
  { key: 'discharge_date', label: 'Discharge (DTP*096)' },
  { key: 'hearing_vision_prescription_date', label: 'Hearing/Vision Rx (DTP*471)' },
  { key: 'disability_start_date', label: 'Disability Start (DTP*360)' },
  { key: 'disability_end_date', label: 'Disability End (DTP*361)' },
  { key: 'last_worked_date', label: 'Last Worked (DTP*297)' },
  { key: 'authorized_return_to_work_date', label: 'Authorized Return (DTP*296)' },
  { key: 'assumed_care_date', label: 'Assumed Care (DTP*090)' },
  { key: 'relinquished_care_date', label: 'Relinquished Care (DTP*091)' },
];

export function optionEntries(map: Record<string, string>): Array<{ value: string; label: string }> {
  return Object.entries(map).map(([value, label]) => ({ value, label: `${value} - ${label}` }));
}

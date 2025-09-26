import {
  ChangeEvent,
  FocusEvent,
  FormEvent,
  useCallback,
  useState,
} from "react";
import Image from "next/image";
import { z } from "zod";
import QRCode from "qrcode";
import Input from "@/components/input/Input";
import formStyles from "@/styles/Form.module.css";
import type { Translation } from "../../../i18n";

type FormState = {
  firstName: string;
  lastName: string;
  jobTitle: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

type QrErrorKey = "generationFailed";

type Props = {
  translation: Translation;
  translate: (key: string) => string;
};

const formSchema = z
  .object({
    firstName: z.string().trim().min(1, "validation.firstNameRequired"),
    lastName: z.string().trim(),
    jobTitle: z.string().trim(),
    company: z.string().trim(),
    email: z
      .email("validation.emailInvalid")
      .or(z.literal("")),
    phone: z.string().trim().min(1, "validation.phoneRequired"),
    website: z
      .url("validation.websiteInvalid")
      .or(z.literal("")),
    street: z.string().trim(),
    city: z.string().trim(),
    state: z.string().trim(),
    postalCode: z.string().trim(),
    country: z.string().trim(),
  })
  .required() satisfies z.ZodType<FormState>;

const initialFormState: FormState = {
  firstName: "",
  lastName: "",
  jobTitle: "",
  company: "",
  email: "",
  phone: "",
  website: "",
  street: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
};

const VCardForm = ({ translation, translate }: Props) => {
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrError, setQrError] = useState<QrErrorKey | null>(null);

  const helperMessage = qrError
    ? translate(`messages.errors.${qrError}`)
    : translation.messages.helper;

  const setFieldError = useCallback((field: keyof FormState, message?: string) => {
    setErrors((previous) => {
      if (message) {
        if (previous[field] === message) {
          return previous;
        }

        return {
          ...previous,
          [field]: message,
        };
      }

      if (!(field in previous)) {
        return previous;
      }

      const next = { ...previous };
      delete next[field];
      return next;
    });
  }, []);

  const validateField = useCallback(
    (field: keyof FormState, value: string) => {
      const fieldSchema = formSchema.shape[field];
      const result = fieldSchema.safeParse(value);

      if (!result.success) {
        const message = result.error.issues[0]?.message ?? "validation.generic";
        setFieldError(field, message);
        return false;
      }

      setFieldError(field);
      return true;
    },
    [setFieldError]
  );

  const handleChange = useCallback(
    (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setFormData((previous) => ({
        ...previous,
        [field]: value,
      }));
    },
    []
  );

  const handleBlur = useCallback(
    (field: keyof FormState) => (event: FocusEvent<HTMLInputElement>) => {
      validateField(field, event.target.value);
    },
    [validateField]
  );

  const buildVCard = useCallback((data: FormState) => {
    const formattedName = `${data.lastName};${data.firstName}`;
    const displayName = `${data.firstName} ${data.lastName}`.trim() || data.firstName || data.lastName;
    const lines: string[] = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${formattedName}`,
      `FN:${displayName}`,
    ];

    if (data.jobTitle) {
      lines.push(`TITLE:${data.jobTitle}`);
    }

    if (data.company) {
      lines.push(`ORG:${data.company}`);
    }

    if (data.email) {
      lines.push(`EMAIL;TYPE=INTERNET:${data.email}`);
    }

    if (data.phone) {
      lines.push(`TEL;TYPE=CELL:${data.phone}`);
    }

    if (data.website) {
      lines.push(`URL:${data.website}`);
    }

    const addressSegments = [
      "",
      "",
      data.street,
      data.city,
      data.state,
      data.postalCode,
      data.country,
    ];

    if (addressSegments.some((segment) => segment?.trim())) {
      lines.push(
        `ADR;TYPE=WORK:${addressSegments
          .map((segment) => segment?.trim() ?? "")
          .join(";")}`
      );
    }

    lines.push("END:VCARD");

    return lines.join("\n");
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const result = formSchema.safeParse(formData);

      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        const validationErrors = Object.entries(fieldErrors).reduce<FormErrors>((accumulator, [key, messages]) => {
          if (messages && messages.length > 0) {
            accumulator[key as keyof FormState] = messages[0];
          }

          return accumulator;
        }, {});

        setErrors(validationErrors);
        return;
      }

      setErrors({});
      setQrError(null);

      try {
        setIsGenerating(true);
        const vcardPayload = buildVCard(result.data);
        const dataUrl = await QRCode.toDataURL(vcardPayload, {
          errorCorrectionLevel: "M",
          margin: 1,
          scale: 6,
        });

        setQrCodeData(dataUrl);
      } catch (generationError) {
        console.error("Failed to generate QR code", generationError);
        setQrError("generationFailed");
      } finally {
        setIsGenerating(false);
      }
    },
    [buildVCard, formData]
  );

  const resetFormData = useCallback(() => {
    setFormData(initialFormState);
    setErrors({});
    setQrCodeData(null);
    setQrError(null);
  }, []);

  const closeQrModal = useCallback(() => {
    setQrCodeData(null);
  }, []);

  const downloadQrCode = useCallback(() => {
    if (!qrCodeData) {
      return;
    }

    const combinedName = `${formData.firstName} ${formData.lastName}`.trim();
    const safeName = combinedName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "");
    const fileName = safeName ? `${safeName}-vcard-qr.png` : "contact-vcard-qr.png";

    const link = document.createElement("a");
    link.href = qrCodeData;
    link.download = fileName;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [formData.firstName, formData.lastName, qrCodeData]);

  return (
    <>
      <form className={formStyles.form} onSubmit={handleSubmit} noValidate>
        <div className={formStyles.group}>
          <header className={formStyles.groupHeader}>
            <h2>{translation.sections.basic.heading}</h2>
            <p>{translation.sections.basic.subheading}</p>
          </header>
          <div className={formStyles.fieldsGrid}>
            <Input
              label={translation.labels.firstName}
              placeholder={translation.placeholders.firstName}
              value={formData.firstName}
              onChange={handleChange("firstName")}
              onBlur={handleBlur("firstName")}
              error={errors.firstName ? translate(errors.firstName) : undefined}
              required
            />
            <Input
              label={translation.labels.lastName}
              placeholder={translation.placeholders.lastName}
              value={formData.lastName}
              onChange={handleChange("lastName")}
              onBlur={handleBlur("lastName")}
              error={errors.lastName ? translate(errors.lastName) : undefined}
            />
            <Input
              label={translation.labels.jobTitle}
              placeholder={translation.placeholders.jobTitle}
              value={formData.jobTitle}
              onChange={handleChange("jobTitle")}
              onBlur={handleBlur("jobTitle")}
              error={errors.jobTitle ? translate(errors.jobTitle) : undefined}
            />
                        <Input
              label={translation.labels.company}
              placeholder={translation.placeholders.company}
              value={formData.company}
              onChange={handleChange("company")}
              onBlur={handleBlur("company")}
              error={errors.company ? translate(errors.company) : undefined}
            />
          </div>
        </div>

        <div className={formStyles.group}>
          <header className={formStyles.groupHeader}>
            <h2>{translation.sections.contact.heading}</h2>
            <p>{translation.sections.contact.subheading}</p>
          </header>
          <div className={formStyles.fieldsGrid}>
            <Input
              label={translation.labels.email}
              type="email"
              placeholder={translation.placeholders.email}
              value={formData.email}
              onChange={handleChange("email")}
              onBlur={handleBlur("email")}
              error={errors.email ? translate(errors.email) : undefined}
            />
            <Input
              label={translation.labels.phone}
              type="tel"
              placeholder={translation.placeholders.phone}
              value={formData.phone}
              onChange={handleChange("phone")}
              onBlur={handleBlur("phone")}
              error={errors.phone ? translate(errors.phone) : undefined}
              required
            />
            <Input
              label={translation.labels.website}
              type="url"
              placeholder={translation.placeholders.website}
              value={formData.website}
              onChange={handleChange("website")}
              onBlur={handleBlur("website")}
              error={errors.website ? translate(errors.website) : undefined}
            />
          </div>
        </div>

        <div className={formStyles.group}>
          <header className={formStyles.groupHeader}>
            <h2>{translation.sections.location.heading}</h2>
            <p>{translation.sections.location.subheading}</p>
          </header>
          <div className={formStyles.fieldsGrid}>
            <Input
              label={translation.labels.street}
              placeholder={translation.placeholders.street}
              value={formData.street}
              onChange={handleChange("street")}
              onBlur={handleBlur("street")}
              error={errors.street ? translate(errors.street) : undefined}
            />
            <Input
              label={translation.labels.city}
              placeholder={translation.placeholders.city}
              value={formData.city}
              onChange={handleChange("city")}
              onBlur={handleBlur("city")}
              error={errors.city ? translate(errors.city) : undefined}
            />
            <Input
              label={translation.labels.state}
              placeholder={translation.placeholders.state}
              value={formData.state}
              onChange={handleChange("state")}
              onBlur={handleBlur("state")}
              error={errors.state ? translate(errors.state) : undefined}
            />
            <Input
              label={translation.labels.postalCode}
              placeholder={translation.placeholders.postalCode}
              value={formData.postalCode}
              onChange={handleChange("postalCode")}
              onBlur={handleBlur("postalCode")}
              error={errors.postalCode ? translate(errors.postalCode) : undefined}
            />
            <Input
              label={translation.labels.country}
              placeholder={translation.placeholders.country}
              value={formData.country}
              onChange={handleChange("country")}
              onBlur={handleBlur("country")}
              error={errors.country ? translate(errors.country) : undefined}
            />
          </div>
        </div>

        <div className={formStyles.actions}>
          <button type="submit" className={formStyles.submitButton} disabled={isGenerating}>
            {translation.buttons.submit}
          </button>
          <button type="button" onClick={resetFormData} className={formStyles.resetButton}>
            {translation.buttons.reset}
          </button>
        </div>
      </form>

      {qrCodeData ? (
        <div className={formStyles.modalBackdrop} role="presentation" onClick={closeQrModal}>
          <div
            className={formStyles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-code-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={formStyles.modalClose}
              onClick={closeQrModal}
              aria-label={translation.modal.close}
            >
              &times;
            </button>
            <header className={formStyles.modalHeader}>
              <h2 id="qr-code-modal-title">{translation.modal.title}</h2>
              <p>{translation.modal.subtitle}</p>
            </header>
            <div className={formStyles.modalBody}>
              <Image
                src={qrCodeData}
                alt={translation.modal.title}
                className={formStyles.qrImage}
                width={240}
                height={240}
                style={{ width: "240px", height: "240px" }}
                unoptimized
              />
            </div>
            <div className={formStyles.modalActions}>
              <button type="button" className={formStyles.downloadButton} onClick={downloadQrCode}>
                {translation.buttons.download}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default VCardForm;

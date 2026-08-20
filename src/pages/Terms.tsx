import { useTranslation } from 'react-i18next';
import '../styles/components/Terms.css';

export default function Terms() {
  const { t } = useTranslation();

  return (
    <div className="container py-5 terms-container">
      <h1 className="terms-title">{t('terms.title', 'Términos y Condiciones')}</h1>
      
      <div className="terms-content">
        <h2>{t('terms.sec1Title', 'De la compra de boletos de viaje y condiciones generales del servicio')}</h2>
        <ul>
          <li>{t('terms.sec1Item1', 'El pasajero solicitará información según su interés en caso decida comprar un boleto de viaje estará en la obligación de proporcionar información relativa a su identificación personal y de ser el necesario, número de RUC y razón social, NO SE ADMITE RECTIFICACIONES, ANULACIONES O DEVOLUCIONES una vez emitido el comprobante de pago.')}</li>
          <li>{t('terms.sec1Item2', 'Es responsabilidad del pasajero verificar la información contenida en el boleto de viaje, el mismo que de no ser conforme, el pasajero podrá solicitar su rectificación inmediata. Con la recepción satisfactoria del boleto de viaje, el pasajero declara la aceptación plena de su contenido y las condiciones de contratación del servicio establecidas en el presente. NO SE ADMITEN DEVOLUCIONES.')}</li>
          <li>{t('terms.sec1Item3', 'Las tarifas son referenciales y pueden variar de acuerdo a la temporada sin previo aviso.')}</li>
          <li>{t('terms.sec1Item4', 'El boleto de viaje es personal e intransferible, valido solo para la ruta, fecha y hora de viaje consignado en dicho documento.')}</li>
          <li>{t('terms.sec1Item5', 'Los pasajeros tienen el derecho a transportar 25 kilogramos de equipaje o su equivalente en volumen a 40 cm x 40 cm x 30 cm, exclusivamente maletas, maletines y bolsos con artículos de uso personal, el exceso de equipaje será admitido siempre y cuando la capacidad del vehículo lo permita previo pago de la tarifa vigente.')}</li>
          <li>{t('terms.sec1Item6', 'Con posterioridad a la emisión del boleto y para posibles reclamaciones o cambio de hora y fecha de viaje no se admitirán borrones ni enmendaduras en el boleto de viaje.')}</li>
          <li>{t('terms.sec1Item7', 'No se admiten cambios, modificaciones, ni devoluciones en boletos de viaje adquiridos 59 minutos antes de la hora consignada en el boleto de viaje.')}</li>
          <li>{t('terms.sec1Item8', 'No se admiten billetes de la denominación (200) soles por temas de seguridad.')}</li>
          <li>{t('terms.sec1Item9', 'Los billetes falsos presentados en ventanilla serán retenidos, picados y reportados a la autoridad competente.')}</li>
          <li>{t('terms.sec1Item10', 'No se admite cambio de boleta de venta por factura.')}</li>
          <li>{t('terms.sec1Item11', 'Dentro y fuera del vehículo o los terminales, el pasajero es responsable de la custodia de sus pertenencias, la empresa no se responsabiliza por la pérdida o daño de objetos no declarados, así mismo, no se responsabiliza por el daño de equipajes defectuosamente embalados.')}</li>
          <li>{t('terms.sec1Item12', 'El pasajero viajará protegido por una póliza de seguro contra accidentes de tránsito (SOAT).')}</li>
          <li>{t('terms.sec1Item13', 'La empresa se reserva la obligación de transportar pasajeros convalecientes, de ser admitidos el pasajero viajará acompañado de un profesional de la salud y bajo su responsabilidad.')}</li>
          <li>{t('terms.sec1Item14', 'En caso ocurra una eventualidad que impida continuar y/o iniciar el viaje habilitado ya sea en el lugar de origen o durante el viaje, la empresa queda autorizada para realizar el transbordo de pasajeros.')}</li>
          <li>{t('terms.sec1Item15', 'Prohibido el cambio de pañales en el salón del vehículo, así como el consumo o traslado de alimentos preparados.')}</li>
          <li>{t('terms.sec1Item16', 'Prohibido transportar balones de gas o materias inflamables fuera del rango establecido por la autoridad competente.')}</li>
        </ul>

        <h2>{t('terms.sec2Title', 'Del viaje de menores de edad')}</h2>
        <ul>
          <li>{t('terms.sec2Item1', 'Conforme a lo establecido por la ley N° 27337 (ley general de transporte), los menores de edad que viajen solos o en compañía de un adulto que no sean sus padres, presentarán la respectiva autorización notarial de viaje. No está permitido que menores de nueve (09) años viajen solos.')}</li>
          <li>{t('terms.sec2Item2', 'Los niños mayores de cinco (05) años de edad pagan su respectivo pasaje, viajan con boleto de viaje y asiento asignado.')}</li>
        </ul>

        <h2>{t('terms.sec3Title', 'Del abordaje de pasajeros, embarque y desembarque de equipajes')}</h2>
        <ul>
          <li>{t('terms.sec3Item1', 'El pasajero se presentará en el punto de embarque 30 minutos antes de la hora de viaje especificada en el boleto, caso contrario perderá el derecho de viaje y el importe pagado.')}</li>
          <li>{t('terms.sec3Item2', 'Para abordar el vehículo el pasajero presentará su boleto de viaje físico o electrónico y su documento de identidad original.')}</li>
          <li>{t('terms.sec3Item3', 'No se permite abordar cuando el titular se encuentre bajo los efectos del alcohol o sustancias ilícitas.')}</li>
          <li>{t('terms.sec3Item4', 'Está prohibido abordar con armas de fuego o elementos punzocortantes, explosivos o corrosivos.')}</li>
          <li>{t('terms.sec3Item5', 'Queda prohibido transportar mascotas en el salón, salvo animales de asistencia debidamente acreditados.')}</li>
          <li>{t('terms.sec3Item6', 'No se admite el embarque o desembarque en lugares no autorizados por la autoridad de transporte.')}</li>
          <li>{t('terms.sec3Item7', 'El desembarque en puntos intermedios estará sujeto a la condición de la vía y autorización del conductor.')}</li>
        </ul>

        <h2>{t('terms.sec4Title', 'De las postergaciones y reprogramaciones de viajes')}</h2>
        <ul>
          <li>{t('terms.sec4Item1', 'La solicitud de postergación o reprogramación debe realizarse mínimo con dos (02) horas de anticipación.')}</li>
          <li>{t('terms.sec4Item2', 'El boleto podrá quedar en "Fecha Libre" por un plazo máximo de 30 días naturales.')}</li>
          <li>{t('terms.sec4Item3', 'En caso de suspensión por causas de fuerza mayor, el viaje será reprogramado dentro de las 12 horas siguientes.')}</li>
        </ul>

        <h2>{t('terms.sec5Title', 'De las reservas')}</h2>
        <ul>
          <li>{t('terms.sec5Item1', 'Las reservas realizadas tienen vigencia limitada y se liberan automáticamente de no confirmarse el pago.')}</li>
          <li>{t('terms.sec5Item2', 'El usuario debe confirmar su pago mediante los canales autorizados para asegurar su asiento.')}</li>
        </ul>

        <h2>{t('terms.sec6Title', 'Del servicio de encomiendas y giros')}</h2>
        <ul>
          <li>{t('terms.sec6Item1', 'El remitente debe presentar obligatoriamente su DNI y declarar el contenido exacto del paquete.')}</li>
          <li>{t('terms.sec6Item2', 'El recojo se realizará en las oficinas autorizadas previa presentación del DNI del destinatario.')}</li>
          <li>{t('terms.sec6Item3', 'No se admitirán reclamos posteriores al retiro conforme de la encomienda.')}</li>
        </ul>
      </div>
    </div>
  );
}

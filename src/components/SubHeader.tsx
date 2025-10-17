import React from 'react';
import { IonHeader } from '@ionic/react';
import { ArrowLeft } from 'lucide-react';
import { useHistory } from 'react-router-dom';

interface SubHeaderProps {
  title?: string;
}

const SubHeader: React.FC<SubHeaderProps> = ({ title = '제목' }) => {
  const history = useHistory();

  return (
    <IonHeader className="ion-no-border">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <button onClick={() => history.goBack()} className="p-1 -ml-1">
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        {title && (
          <h1 className="absolute left-1/2 transform -translate-x-1/2 text-lg font-semibold text-gray-900">
            {title}
          </h1>
        )}
        <div className="w-6"></div>
      </div>
    </IonHeader>
  );
};

export default SubHeader;
